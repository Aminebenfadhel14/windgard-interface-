import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/ratelimit';
import { checkEntitlement } from '@/lib/entitlement';
import { transcribe } from '@/lib/transcribe';
import { getAIProvider } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // ~2 min of webm comfortably

/** POST /api/sessions/:id/attempts — record → transcribe → score. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(req);
    await enforceRateLimit(auth.userId);

    const { data: session } = await auth.db
      .from('sessions').select('id, questions, resume_text, job_description_text, status')
      .eq('id', params.id).maybeSingle();
    if (!session) throw new ApiError('not_found', 'Session not found.', 404);

    if (!(await checkEntitlement(auth.db, auth.userId, session.id))) {
      throw new ApiError('payment_required', 'Practice mode requires a purchase or subscription.', 402);
    }

    const form = await req.formData();
    const audio = form.get('audio');
    const questionIndex = Number(form.get('question_index'));
    if (!(audio instanceof File)) throw new ApiError('missing_audio', 'Attach your recording as "audio".', 400);
    if (!AUDIO_TYPES.includes(audio.type)) throw new ApiError('unsupported_type', 'Use webm or m4a audio.', 415);
    if (audio.size > MAX_AUDIO_BYTES) throw new ApiError('file_too_large', 'Recording too large — keep it under 2 minutes.', 413);
    if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex > 6) {
      throw new ApiError('bad_question_index', 'question_index must be 0-6.', 400);
    }

    const questions = session.questions as Array<{ text: string; tip: string }>;
    const question = questions?.[questionIndex];
    if (!question) throw new ApiError('bad_question_index', 'No such question in this session.', 400);

    // Store audio (auto-purged after 7 days)
    const admin = supabaseAdmin();
    const audioPath = `${auth.userId}/${session.id}/q${questionIndex}-${Date.now()}.webm`;
    await admin.storage.from('recordings')
      .upload(audioPath, Buffer.from(await audio.arrayBuffer()), { contentType: audio.type });

    // Whisper → Claude call #2
    const transcript = await transcribe(audio, 'answer.webm');
    const ai = getAIProvider({ userId: auth.userId, consent: false });
    const result = await ai.score({ question: question.text, tip: question.tip, transcript });

    const { data: attempt, error } = await auth.db.from('practice_attempts').insert({
      session_id: session.id,
      question_index: questionIndex,
      audio_url: audioPath,
      transcript,
      scores: result.scores,
      improved_answer: result.improved_answer,
    }).select().single();
    if (error) throw new ApiError('db_error', 'Could not save your attempt.', 500);

    if (session.status === 'generated') {
      await auth.db.from('sessions').update({ status: 'practicing' }).eq('id', session.id);
    }

    return NextResponse.json({ attempt, summary: result.summary }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
