import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/ratelimit';
import { checkEntitlement } from '@/lib/entitlement';
import { getAIProvider } from '@/lib/ai';
import { renderCheatSheetPdf } from '@/lib/pdf/cheat-sheet';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** POST /api/sessions/:id/cheat-sheet — generate + render + store PDF. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(req);
    await enforceRateLimit(auth.userId);

    const { data: session } = await auth.db.from('sessions').select('*').eq('id', params.id).maybeSingle();
    if (!session) throw new ApiError('not_found', 'Session not found.', 404);

    if (!(await checkEntitlement(auth.db, auth.userId, session.id))) {
      throw new ApiError('payment_required', 'The cheat sheet requires a purchase or subscription.', 402);
    }

    const { data: attempts } = await auth.db
      .from('practice_attempts')
      .select('question_index, transcript, improved_answer')
      .eq('session_id', session.id).order('created_at');

    const questions = session.questions as Array<{ text: string }>;
    // Keep the latest attempt per question
    const latest = new Map<number, { transcript: string; improved_answer: string | null }>();
    for (const a of attempts ?? []) latest.set(a.question_index, a);

    // Claude call #3
    const ai = getAIProvider({ userId: auth.userId, consent: false });
    const sheet = await ai.cheatSheet({
      resume: session.resume_text ?? '',
      jd: session.job_description_text ?? '',
      gapAnalysis: session.gap_analysis,
      attempts: [...latest.entries()].map(([i, a]) => ({
        question: questions[i]?.text ?? `Question ${i + 1}`,
        transcript: a.transcript,
        improved_answer: a.improved_answer,
      })),
    });

    const pdf = await renderCheatSheetPdf(sheet);
    const admin = supabaseAdmin();
    const path = `${auth.userId}/${session.id}/cheat-sheet.pdf`;
    const { error: upErr } = await admin.storage.from('cheat-sheets')
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
    if (upErr) throw new ApiError('upload_failed', 'Could not store the PDF. Please retry.', 502);

    await auth.db.from('sessions')
      .update({ cheat_sheet_url: path, status: 'completed' }).eq('id', session.id);

    const { data: signed } = await admin.storage.from('cheat-sheets').createSignedUrl(path, 60 * 60);
    return NextResponse.json({ cheat_sheet: sheet, download_url: signed?.signedUrl ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}
