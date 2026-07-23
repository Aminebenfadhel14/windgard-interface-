import { supabaseAdmin } from '@/lib/supabase/server';

export interface AICallLog {
  userId?: string;
  kind: 'analyze' | 'score' | 'cheat_sheet';
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  costUsdEst?: number;
  consent: boolean;
  input?: unknown;  // stored only when consent
  output?: unknown; // stored only when consent
}

export async function logAICall(log: AICallLog): Promise<void> {
  try {
    await supabaseAdmin().from('ai_call_logs').insert({
      user_id: log.userId ?? null,
      kind: log.kind,
      model: log.model,
      input_tokens: log.inputTokens ?? null,
      output_tokens: log.outputTokens ?? null,
      latency_ms: log.latencyMs,
      cost_usd_est: log.costUsdEst ?? null,
      consent: log.consent,
      input: log.consent ? log.input : null,
      output: log.consent ? log.output : null,
    });
  } catch (e) {
    console.error('ai log failed', e); // never block the request on logging
  }
}
