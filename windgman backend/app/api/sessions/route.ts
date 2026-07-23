import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/errors';
import { enforceRateLimit } from '@/lib/ratelimit';
import { extractResumeText } from '@/lib/extract';
import { getAIProvider } from '@/lib/ai';
import { CreateSessionBody } from '@/lib/schemas';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** POST /api/sessions — create a session: upload resume + JD, run gap analysis. */
export async function POST(req: Request) {
  try {
    const auth = await requireUser(req);
    await enforceRateLimit(auth.userId);

    const form = await req.formData();
    const file = form.get('resume');
    if (!(file instanceof File)) throw new ApiError('missing_resume', 'Attach your resume as "resume".', 400);
    const body = CreateSessionBody.parse({
      job_description_text: form.get('job_description_text'),
      consent_training: form.get('consent_training') === 'true',
    });

    const resumeText = await extractResumeText(file);

    // Store the original file under the user's prefix
    const admin = supabaseAdmin();
    const path = `${auth.userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
    const { error: upErr } = await admin.storage.from('resumes')
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
    if (upErr) throw new ApiError('upload_failed', 'Could not store your resume. Please retry.', 502);

    // Claude call #1 — gap analysis + 7 questions
    const ai = getAIProvider({ userId: auth.userId, consent: body.consent_training });
    const analysis = await ai.analyze(resumeText, body.job_description_text);

    const { data: session, error } = await auth.db.from('sessions').insert({
      user_id: auth.userId,
      resume_file_url: path,
      resume_text: resumeText,
      job_description_text: body.job_description_text,
      company_name: analysis.company_name,
      job_title: analysis.job_title,
      gap_analysis: analysis.gap_analysis,
      questions: analysis.questions,
      status: 'generated',
    }).select().single();
    if (error) throw new ApiError('db_error', 'Could not save your session.', 500);

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

/** GET /api/sessions — dashboard list. */
export async function GET(req: Request) {
  try {
    const auth = await requireUser(req);
    const { data, error } = await auth.db
      .from('sessions')
      .select('id, company_name, job_title, status, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new ApiError('db_error', 'Could not load sessions.', 500);
    return NextResponse.json({ sessions: data });
  } catch (err) {
    return errorResponse(err);
  }
}
