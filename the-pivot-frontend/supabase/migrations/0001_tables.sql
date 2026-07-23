-- The Pivot — core tables, RLS, triggers

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT, avatar_url TEXT, company TEXT, job_title TEXT,
    stripe_customer_id TEXT UNIQUE,
    subscription_status TEXT NOT NULL DEFAULT 'none', -- none | trialing | active | canceled | past_due
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_file_url TEXT, resume_text TEXT,
    job_description_text TEXT, company_name TEXT, job_title TEXT,
    gap_analysis JSONB,
    questions JSONB,
    cheat_sheet_url TEXT,
    status TEXT NOT NULL DEFAULT 'generated', -- generated | practicing | completed
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX sessions_user_idx ON public.sessions(user_id, created_at DESC);

CREATE TABLE public.practice_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    question_index INT NOT NULL CHECK (question_index BETWEEN 0 AND 6),
    audio_url TEXT, transcript TEXT,
    scores JSONB,
    improved_answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX attempts_session_idx ON public.practice_attempts(session_id, question_index);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    stripe_payment_id TEXT UNIQUE,
    amount INT, status TEXT, -- succeeded | failed
    session_id UUID REFERENCES public.sessions(id), -- NULL = unclaimed one-time credit
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX payments_user_idx ON public.payments(user_id);

-- Stripe webhook idempotency
CREATE TABLE public.stripe_events (
    id TEXT PRIMARY KEY, -- Stripe event id
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI call logs (also future training data, gated by consent)
CREATE TABLE public.ai_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    kind TEXT NOT NULL,          -- analyze | score | cheat_sheet
    model TEXT NOT NULL,
    input_tokens INT, output_tokens INT,
    latency_ms INT, cost_usd_est NUMERIC(10,5),
    consent BOOLEAN NOT NULL DEFAULT FALSE,
    input JSONB, output JSONB,   -- only stored when consent = TRUE
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sessions_updated BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;   -- service role only
ALTER TABLE public.ai_call_logs ENABLE ROW LEVEL SECURITY;    -- service role only

CREATE POLICY "own profile read"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "own sessions" ON public.sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own attempts" ON public.practice_attempts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.user_id = auth.uid()))
  WITH CHECK   (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));

CREATE POLICY "own payments read" ON public.payments FOR SELECT USING (auth.uid() = user_id);
-- payments are written only by the service role (webhook)
