import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/errors';
import { CheckoutBody } from '@/lib/schemas';
import { stripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** POST /api/checkout — create a Stripe Checkout session. */
export async function POST(req: Request) {
  try {
    const auth = await requireUser(req);
    const body = CheckoutBody.parse(await req.json());

    // Reuse or create the Stripe customer
    const admin = supabaseAdmin();
    const { data: profile } = await admin.from('profiles')
      .select('stripe_customer_id').eq('id', auth.userId).single();
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.email ?? undefined,
        metadata: { user_id: auth.userId },
      });
      customerId = customer.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', auth.userId);
    }

    const isSub = body.plan === 'subscription';
    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSub ? 'subscription' : 'payment',
      line_items: [{ price: isSub ? env.STRIPE_PRICE_SUBSCRIPTION : env.STRIPE_PRICE_ONE_TIME, quantity: 1 }],
      ...(isSub ? { subscription_data: { trial_period_days: 7 } } : {}),
      success_url: `${env.APP_URL}/session/${body.session_id ?? ''}?paid=1`,
      cancel_url: `${env.APP_URL}/pricing?canceled=1`,
      metadata: { user_id: auth.userId, plan: body.plan, session_id: body.session_id ?? '' },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    return errorResponse(err);
  }
}
