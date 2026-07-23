# The Pivot — Backend

Interview-prep SaaS backend: Next.js (App Router) API routes + Supabase + Claude + Whisper + Stripe + Resend.

## Architecture

```
app/api/
  sessions/                POST create (resume + JD → gap analysis), GET list
  sessions/[id]/           GET full session
  sessions/[id]/attempts/  POST audio → Whisper → scoring
  sessions/[id]/cheat-sheet/ POST generate PDF
  sessions/[id]/email/     POST send PDF via Resend
  checkout/                POST Stripe Checkout
  stripe/webhook/          POST signature-verified, idempotent
lib/
  ai/                      AIProvider abstraction (Claude impl) + call logging
  prompts/                 3 versioned prompt templates
  pdf/                     react-pdf cheat sheet renderer
  entitlement.ts           one-time credit / subscription logic
supabase/migrations/       tables + RLS + storage buckets + pg_cron purge
```

All AI calls go through `getAIProvider()` (`lib/ai/index.ts`). Nothing else imports the Anthropic SDK — swapping to a self-hosted model later means one new file implementing `AIProvider`.

## Setup

1. **Install**: `npm install`
2. **Supabase**: create a project, then run migrations:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
   Enable the `pg_cron` extension in Dashboard → Database → Extensions (needed for the 7-day recordings purge).
3. **Env**: `cp .env.example .env.local` and fill every key. The service-role key must never reach the client.
4. **Stripe**:
   - Create two prices: one-time $14.99 → `STRIPE_PRICE_ONE_TIME`, recurring $29/mo → `STRIPE_PRICE_SUBSCRIPTION` (trial is applied at checkout).
   - Local webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, copy the `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
5. **Run**: `npm run dev`

## Auth

Every route (except the Stripe webhook) expects `Authorization: Bearer <supabase-access-token>`. The frontend obtains the token via Supabase Auth (`supabase.auth.getSession()`).

## Entitlements

- Free: create session + view gap analysis.
- One-time ($14.99): unlocks practice + cheat sheet for exactly one session (the first entitled action claims the credit).
- Subscription ($29/mo, 7-day trial): unlimited.
Logic centralized in `lib/entitlement.ts`; webhook writes in `app/api/stripe/webhook`.

## Tests

```bash
npm test          # vitest: schemas, entitlement logic
npm run typecheck
```

## Deploy (Vercel)

1. Push to GitHub → import in Vercel.
2. Add all env vars (Production + Preview). Set `APP_URL` to the deployed URL.
3. Add a production Stripe webhook endpoint pointing to `https://<domain>/api/stripe/webhook`; update `STRIPE_WEBHOOK_SECRET`.
4. AI routes set `maxDuration = 60` — requires a Vercel plan allowing 60s functions (Hobby caps lower; Pro recommended).

## Cost guards

- Claude input capped at ~8k tokens (`lib/tokens.ts`).
- Rate limit 10 req/min/user on AI routes (Upstash; no-op in dev without env vars).
- Every AI call logged to `ai_call_logs` with latency, tokens, and estimated cost. Inputs/outputs stored only when the user consented (`consent_training`) — this is your future training dataset, collected legally.

amine