import { describe, it, expect } from 'vitest';
import { checkEntitlement } from '@/lib/entitlement';

/** Minimal in-memory stub of the supabase query builder used by checkEntitlement. */
function makeDb(state: {
  subscription_status?: string;
  attachedPayment?: boolean;
  unclaimedCredit?: boolean;
}) {
  const chain = (result: unknown) => {
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'is', 'limit', 'update']) {
      c[m] = () => c;
    }
    (c as { maybeSingle: () => Promise<{ data: unknown; error: null }> }).maybeSingle =
      async () => ({ data: result, error: null });
    // update(...).eq(...).is(...) resolves as a thenable
    (c as { then: (fn: (v: { error: null }) => void) => void }).then = (fn) => fn({ error: null });
    return c;
  };
  let call = 0;
  return {
    from(table: string) {
      if (table === 'profiles') return chain(state.subscription_status ? { subscription_status: state.subscription_status } : null);
      if (table === 'payments') {
        call++;
        if (call === 1) return chain(state.attachedPayment ? { id: 'p1' } : null);
        return chain(state.unclaimedCredit ? { id: 'p2' } : null);
      }
      return chain(null);
    },
  } as never;
}

describe('checkEntitlement', () => {
  it('grants access to active subscribers', async () => {
    expect(await checkEntitlement(makeDb({ subscription_status: 'active' }), 'u1', 's1')).toBe(true);
  });
  it('grants access to trialing subscribers', async () => {
    expect(await checkEntitlement(makeDb({ subscription_status: 'trialing' }), 'u1', 's1')).toBe(true);
  });
  it('grants access when a payment is attached to the session', async () => {
    expect(await checkEntitlement(makeDb({ attachedPayment: true }), 'u1', 's1')).toBe(true);
  });
  it('claims an unclaimed one-time credit', async () => {
    expect(await checkEntitlement(makeDb({ unclaimedCredit: true }), 'u1', 's1')).toBe(true);
  });
  it('denies free users', async () => {
    expect(await checkEntitlement(makeDb({}), 'u1', 's1')).toBe(false);
  });
  it('denies canceled subscribers with no credits', async () => {
    expect(await checkEntitlement(makeDb({ subscription_status: 'canceled' }), 'u1', 's1')).toBe(false);
  });
});
