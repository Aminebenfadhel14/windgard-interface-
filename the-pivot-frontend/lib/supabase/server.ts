import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/** Admin client — bypasses RLS. Server only. */
export function supabaseAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Client scoped to the caller's JWT — RLS enforced. */
export function supabaseForToken(accessToken: string) {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}
