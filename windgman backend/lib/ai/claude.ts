import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { capInputs } from '@/lib/tokens';
import { logAICall } from '@/lib/ai/log';
import type { AIProvider, AICallMeta, ScoreInput, CheatSheetInput } from '@/lib/ai/provider';
import { GapAnalysisSchema, ScoreSchema, CheatSheetSchema } from '@/lib/schemas';
import { gapAnalysisPrompt } from '@/lib/prompts/gap-analysis';
import { scoringPrompt } from '@/lib/prompts/scoring';
import { cheatSheetPrompt } from '@/lib/prompts/cheat-sheet';

const MODEL = 'claude-sonnet-5';
// $/MTok — adjust if pricing changes
const INPUT_COST = 3 / 1_000_000;
const OUTPUT_COST = 15 / 1_000_000;

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/** Force JSON output via a tool call, validate with Zod, retry once. */
async function jsonCall<T>(
  kind: 'analyze' | 'score' | 'cheat_sheet',
  prompt: string,
  schema: z.ZodType<T>,
  meta: AICallMeta,
  maxTokens: number,
): Promise<T> {
  const started = Date.now();
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      tools: [{
        name: 'emit_result',
        description: 'Emit the structured result',
        input_schema: { type: 'object' as const }, // schema enforced by Zod below
      }],
      tool_choice: { type: 'tool', name: 'emit_result' },
      messages: [{ role: 'user', content: prompt }],
    });

    const block = msg.content.find((b) => b.type === 'tool_use');
    const parsed = block ? schema.safeParse((block as { input: unknown }).input) : null;

    const latencyMs = Date.now() - started;
    const inputTokens = msg.usage.input_tokens;
    const outputTokens = msg.usage.output_tokens;

    if (parsed?.success) {
      await logAICall({
        userId: meta.userId, kind, model: MODEL,
        inputTokens, outputTokens, latencyMs,
        costUsdEst: inputTokens * INPUT_COST + outputTokens * OUTPUT_COST,
        consent: meta.consent, input: { prompt }, output: parsed.data,
      });
      return parsed.data;
    }
    lastErr = parsed?.error ?? new Error('no tool_use block in response');
  }

  console.error('AI JSON validation failed after retry', lastErr);
  throw new ApiError('ai_invalid_output', 'The coach had trouble generating a response. Please try again.', 502);
}

export function createClaudeProvider(meta: AICallMeta): AIProvider {
  return {
    async analyze(resume, jd) {
      const capped = capInputs(resume, jd);
      return jsonCall('analyze', gapAnalysisPrompt(capped.resume, capped.jd), GapAnalysisSchema, meta, 4096);
    },
    async score(input: ScoreInput) {
      return jsonCall('score', scoringPrompt(input.question, input.tip, input.transcript), ScoreSchema, meta, 1500);
    },
    async cheatSheet(input: CheatSheetInput) {
      const capped = capInputs(input.resume, input.jd);
      return jsonCall('cheat_sheet', cheatSheetPrompt({ ...input, resume: capped.resume, jd: capped.jd }), CheatSheetSchema, meta, 3000);
    },
  };
}
