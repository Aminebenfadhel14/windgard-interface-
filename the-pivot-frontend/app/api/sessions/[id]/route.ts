import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/errors';

export const runtime = 'nodejs';

/** GET /api/sessions/:id — full session (gap analysis + questions + attempts). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(req);
    const { data: session, error } = await auth.db
      .from('sessions').select('*').eq('id', params.id).maybeSingle();
    if (error) throw new ApiError('db_error', 'Could not load session.', 500);
    if (!session) throw new ApiError('not_found', 'Session not found.', 404);

    const { data: attempts } = await auth.db
      .from('practice_attempts').select('*')
      .eq('session_id', params.id).order('created_at');

    return NextResponse.json({ session, attempts: attempts ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}
