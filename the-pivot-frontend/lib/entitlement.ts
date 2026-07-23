import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Entitlement rules:
 *  - active/trialing subscription  -> unlimited sessions
 *  - one-time purchase             -> exactly 1 session; the first session that
 *    requests an entitled action claims the unclaimed payment row (session_id NULL).
 * Free users can create a session and see the gap analysis, but not practice or
 * generate the cheat sheet.
 */
export async function checkEntitlement(
  db: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const { data: profile } = await db
    .from('profiles').select('subscription_status').eq('id', userId).maybeSingle();
  if (profile && ['active', 'trialing'].includes(profile.subscription_status)) return true;

  // Payment already attached to this session?
  const { data: attached } = await db
    .from('payments').select('id').eq('user_id', userId)
    .eq('session_id', sessionId).eq('status', 'succeeded').maybeSingle();
  if (attached) return true;

  // Claim an unclaimed one-time credit
  const { data: credit } = await db
    .from('payments').select('id').eq('user_id', userId)
    .is('session_id', null).eq('status', 'succeeded')
    .limit(1).maybeSingle();
  if (credit) {
    const { error } = await db.from('payments')
      .update({ session_id: sessionId })
      .eq('id', credit.id).is('session_id', null); // guard against double-claim
    return !error;
  }
  return false;
}
