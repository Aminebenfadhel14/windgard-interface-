import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/stripe/webhook — public, signature-verified, idempotent.
 * Handles: checkout.session.completed, invoice.paid, customer.subscription.deleted.
 */
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: { code: 'no_signature', message: 'Missing signature' } }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: { code: 'bad_signature', message: 'Invalid signature' } }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Idempotency: insert event id; if it already exists, we've processed it.
  const { error: dupe } = await admin.from('stripe_events').insert({ id: event.id });
  if (dupe) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const cs = event.data.object as Stripe.Checkout.Session;
        const userId = cs.metadata?.user_id;
        if (!userId) break;

        if (cs.mode === 'payment') {
          await admin.from('payments').insert({
            user_id: userId,
            stripe_payment_id: (cs.payment_intent as string) ?? cs.id,
            amount: cs.amount_total ?? 1499,
            status: 'succeeded',
            session_id: cs.metadata?.session_id || null,
          });
        } else if (cs.mode === 'subscription') {
          await admin.from('profiles')
            .update({ subscription_status: 'trialing' }).eq('id', userId);
        }
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;
        await admin.from('profiles')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await admin.from('profiles')
          .update({ subscription_status: 'canceled' })
          .eq('stripe_customer_id', sub.customer as string);
        break;
      }
      default:
        break; // acknowledged, ignored
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // Remove the idempotency marker so Stripe's retry can reprocess
    await admin.from('stripe_events').delete().eq('id', event.id);
    console.error('webhook processing failed', err);
    return NextResponse.json({ error: { code: 'processing_failed', message: 'Retry' } }, { status: 500 });
  }
}
