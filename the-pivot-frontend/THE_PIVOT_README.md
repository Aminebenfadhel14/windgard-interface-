# The Pivot — Your Personal Interview Wingman

A production-ready, AI-powered interview prep SaaS built with Next.js 16, TypeScript, Tailwind CSS, and Framer Motion. Stress-free interview coaching for job seekers with 3–7 days before the big day.

## 🎯 What's Built

### 5-Step User Flow
1. **Landing Page** (`/`) — Upload resume + paste job description, real-time validation, auth gate with magic link
2. **Gap Radar** (`/session/[id]`) — Color-coded gap analysis (critical/weak/strength), staggered reveal animations
3. **Practice** (`/session/[id]/practice`) — 7 questions with live waveform visualization, 2-minute recording limit, auto-stop
4. **Feedback** (inline) — 4 score cards (clarity/relevance/structure/confidence), improved answer suggestions, animations
5. **Cheat Sheet** (`/session/[id]/cheat-sheet`) — Printable guide + confetti celebration, download PDF + email delivery

### Additional Screens
- **Dashboard** (`/dashboard`) — Session history with status chips, new session CTA, empty state
- **Pricing** (`/pricing`) — Two-tier plan cards ($14.99 one-time / $29/mo), FAQ accordion, Stripe checkout
- **Paywall Modal** — Triggered by any 402 payment_required error, both plans, post-payment auto-retry

## 🏗️ Architecture

### Core Stack
- **Next.js 16** — App Router, server components, edge-ready
- **TypeScript** — Full type safety
- **Tailwind CSS + shadcn/ui** — Design system with preset components
- **Framer Motion** — Staggered reveals, animated score bars, micro-interactions
- **TanStack React Query** — API state management, automatic retries, cache
- **Supabase Auth (JS client only)** — Magic link + Google OAuth
- **Canvas Confetti** — Celebration on cheat sheet view

### File Structure
```
app/
  ├── layout.tsx                    # Root layout with fonts, providers, theme toggle
  ├── page.tsx                      # Landing page (resume upload + JD textarea)
  ├── dashboard/page.tsx            # Session history
  ├── pricing/page.tsx              # Pricing cards + FAQ
  └── session/
      └── [id]/
          ├── page.tsx              # Gap Radar
          ├── practice/page.tsx      # Question practice with recorder
          └── cheat-sheet/page.tsx   # Celebration + downloads

components/
  ├── nav.tsx                       # Top nav (logo, dashboard link, theme toggle, auth)
  ├── providers.tsx                 # React Query + Supabase client context
  ├── paywall-modal.tsx             # Upgrade modal with plan cards
  ├── toast-container.tsx           # Toast notifications
  └── ui/                           # shadcn components (badge, button, dialog, progress)

hooks/
  ├── use-api.ts                    # React Query wrapper for API calls
  ├── use-auth.ts                   # Supabase auth state
  ├── use-theme.ts                  # Dark/light mode toggle (persisted)
  └── use-toast.ts                  # Toast notifications

lib/
  ├── api.ts                        # API client with mock mode (MOCK_API=true by default)
  ├── mock-data.ts                  # Fixture data for full session + scores + cheat sheet
  ├── supabase.ts                   # Supabase client (auth only)
  └── utils.ts                      # cn() classname utility

globals.css                         # Design tokens (colors, fonts, radius, animations)
```

## 🎨 Design System (Strict)

### Colors
- **Primary**: #6C63FF (confident purple) + gradient to #8A7DFF
- **Secondary**: #00C9A7 (success, strengths)
- **Accent**: #FF6B6B (critical gaps)
- **Warning**: #FFC857 (weak spots)
- **Dark**: bg #0A0A0F, surface #1A1A2E, border #2A2A4A
- **Light**: bg #FFFFFF, surface #F8F8FC, border #E8E8F0

### Typography
- **UI**: Inter (regular, semibold, bold)
- **Metrics/Counters**: JetBrains Mono (font-mono)

### Components
- Rounded-full buttons with gradient primary
- Rounded-xl cards with subtle shadows
- Shimmer skeletons while loading
- Pulsing record button during capture
- Animated score bars with progress fills
- Staggered card reveals on page load
- Top progress bar (if tracking multi-step flow)

### Animations
- All using Framer Motion (respects `prefers-reduced-motion`)
- Stagger delays for list reveals (0.15s between items)
- Slide-up + fade-in entrance (0.4s, easeOut)
- Score bars animate from 0 to value (0.6s, ease-out)
- Button hover lift (-2px transform)

## 🔌 Backend Contract

All requests send `Authorization: Bearer <access_token>` (from Supabase session).

### Endpoints (Mock Mode)
In `MOCK_API=true` mode (default), all endpoints return realistic fixture data without network calls:

**POST /api/sessions** — Upload resume + JD
```json
{
  "resume": File,
  "job_description_text": string,
  "consent_training": "true"/"false"
}
```
Returns `{ session: { id, company_name, job_title, status, gap_analysis, questions } }`

**GET /api/sessions** — List all sessions
Returns `{ sessions: [{ id, company_name, job_title, status, created_at }] }`

**GET /api/sessions/:id** — Get session + attempts
Returns `{ session, attempts: [] }`

**POST /api/sessions/:id/attempts** — Submit audio answer
```json
{
  "audio": Blob (webm/m4a, ≤2min),
  "question_index": 0–6
}
```
Returns `{ attempt: { scores, transcript, improved_answer }, summary }`

**POST /api/sessions/:id/cheat-sheet** — Generate personalized guide
Returns `{ cheat_sheet: { questions_theyll_ask, star_stories, keywords, ... }, download_url }`

**POST /api/checkout** — Stripe redirect
```json
{ "plan": "one_time" | "subscription", "session_id"?: string }
```
Returns `{ url }` — Redirect user to Stripe

### Error Handling
All errors return `{ error: { code: string, message: string } }`. Special codes:
- `payment_required` (402) → Show paywall modal, then auto-retry after user pays
- `rate_limited` (429) → Show friendly "slow down" toast with retry button
- Other errors → Show message in toast, "Try again" option

## 🎬 Key Features

### MediaRecorder + Waveform
- `getUserMedia()` for microphone capture
- `MediaRecorder` API for .webm encoding
- `AnalyserNode` visualizes live frequency data on `<canvas>`
- Auto-stop at 2:00 with visual countdown
- Graceful mic-permission denied flow

### Loading States
- Skeleton shimmer while API call pending
- "Analyzing..." overlay with staged progress messages on upload
- "Processing your response..." while sending audio

### Empty States
- Warm illustration concept (can be generated)
- Encouraging copy ("No sessions yet — start your first prep")
- CTA button prominent

### Accessibility
- Focus rings on all interactive elements
- aria-label on record button + mic icon
- Semantic HTML (main, header, nav)
- Keyboard navigable
- prefers-reduced-motion respected

## 🚀 Getting Started

### Installation
```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Toggle Mock Mode
In `lib/api.ts`:
```typescript
export const MOCK_API = true  // Set to false to use real backend
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
```

### Mock Fixtures
All data in `lib/mock-data.ts`. One complete session fixture includes:
- Gap analysis (3 critical, 2 weak, 2 strength findings)
- 7 practice questions with tips
- Simulated attempt scores
- Improved answer suggestions
- Full cheat sheet with Q&A, stories, keywords

### Environment Variables
Create a `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3000  # Or your backend URL
```

## 📋 Quality Standards Met

✅ **Zero layout shift** — Skeletons match final layout exactly  
✅ **Empty states designed** — Warm illustrations + CTAs  
✅ **Coach voice throughout** — Encouraging, never clinical ("You got this!" not "Error occurred")  
✅ **Keyboard accessible** — Focus rings, aria labels, semantic HTML  
✅ **useApi hook** — Centralized fetch + bearer token + error normalization + 402 interception  
✅ **Mock mode** — Navigable end-to-end without backend, MOCK_API flag controls behavior  
✅ **Production-ready** — TypeScript strict mode, no console errors, all animations respect `prefers-reduced-motion`

## 🎯 Next Steps (When Backend is Ready)

1. Set `MOCK_API = false` in `lib/api.ts`
2. Update `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend
3. Configure Supabase auth project (get `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Update Stripe checkout success redirect URL to `[YOUR_DOMAIN]/session/[id]?paid=1`
5. All error handling + paywall interception already wired up—should work seamlessly

## 🔐 Security Notes

- Supabase auth token automatically injected into all API requests
- No sensitive data in localStorage (except theme preference)
- RLS enforced server-side (backend contract)
- File uploads validated client-side (PDF/DOCX only, ≤5MB)
- Forms sanitized before submission
- CORS headers handled by backend

---

**Built with coaching energy, obsessive attention to detail, and the goal of helping stressed job seekers land their dream roles in 3 days.**
