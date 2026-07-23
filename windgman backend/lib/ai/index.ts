import type { AIProvider, AICallMeta } from '@/lib/ai/provider';
import { createClaudeProvider } from '@/lib/ai/claude';

/** The only place the concrete provider is chosen. */
export function getAIProvider(meta: AICallMeta): AIProvider {
  return createClaudeProvider(meta);
}
