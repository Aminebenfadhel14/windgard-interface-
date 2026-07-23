import { ApiError } from '@/lib/errors';
import { supabaseAdmin, supabaseForToken } from '@/lib/supabase/server';

export interface AuthContext {
  userId: string;
  email: string | null;
  token: string;
  /** RLS-scoped client for this user */
  db: ReturnType<typeof supabaseForToken>;
}

export async function requireUser(req: Request): Promise<AuthContext> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError('unauthorized', 'Missing bearer token', 401);

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new ApiError('unauthorized', 'Invalid or expired token', 401);

  return { userId: data.user.id, email: data.user.email ?? null, token, db: supabaseForToken(token) };
}
