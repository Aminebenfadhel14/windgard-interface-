import type { GapAnalysisResult, ScoreResult, CheatSheetResult } from '@/lib/schemas';

export interface ScoreInput {
  question: string;
  tip: string;
  transcript: string;
}

export interface CheatSheetInput {
  resume: string;
  jd: string;
  gapAnalysis: unknown;
  attempts: Array<{ question: string; transcript: string; improved_answer: string | null }>;
}

/**
 * Single seam for all AI calls. The rest of the codebase must depend on this
 * interface only — never on the Anthropic SDK directly. Swapping to a
 * self-hosted model later means writing one new implementation file.
 */
export interface AIProvider {
  analyze(resume: string, jd: string): Promise<GapAnalysisResult>;
  score(input: ScoreInput): Promise<ScoreResult>;
  cheatSheet(input: CheatSheetInput): Promise<CheatSheetResult>;
}

export interface AICallMeta {
  userId?: string;
  consent: boolean;
}
