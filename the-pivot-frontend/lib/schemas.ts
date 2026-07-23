import { z } from 'zod';

/* ---------- AI output schemas ---------- */

export const GapAnalysisSchema = z.object({
  company_name: z.string(),
  job_title: z.string(),
  gap_analysis: z.object({
    critical: z.array(z.object({ finding: z.string(), evidence: z.string(), likely_question: z.string() })),
    weak: z.array(z.object({ finding: z.string(), example_before: z.string(), example_after: z.string() })),
    strengths: z.array(z.object({ finding: z.string(), likely_question: z.string() })),
  }),
  questions: z.array(z.object({
    text: z.string(),
    category: z.enum(['critical', 'weak', 'strength']),
    tip: z.string(),
  })).length(7),
});
export type GapAnalysisResult = z.infer<typeof GapAnalysisSchema>;

export const ScoreSchema = z.object({
  scores: z.object({
    clarity: z.number().min(0).max(10),
    relevance: z.number().min(0).max(10),
    structure: z.number().min(0).max(10),
    confidence: z.number().min(0).max(10),
  }),
  summary: z.string(),
  improved_answer: z.string(),
});
export type ScoreResult = z.infer<typeof ScoreSchema>;

export const CheatSheetSchema = z.object({
  company_name: z.string(),
  job_title: z.string(),
  questions_theyll_ask: z.array(z.object({ question: z.string(), how_to_answer: z.string() })).length(3),
  star_stories: z.array(z.object({ title: z.string(), summary: z.string() })).length(3),
  perfect_introduction: z.string(),
  keywords: z.array(z.string()).length(5),
  questions_to_ask: z.array(z.string()).length(3),
});
export type CheatSheetResult = z.infer<typeof CheatSheetSchema>;

/* ---------- Request schemas ---------- */

export const CreateSessionBody = z.object({
  job_description_text: z.string().min(50, 'Job description is too short').max(50_000),
  consent_training: z.boolean().default(false),
});

export const CheckoutBody = z.object({
  plan: z.enum(['one_time', 'subscription']),
  session_id: z.string().uuid().optional(),
});

export const EmailBody = z.object({
  to: z.string().email().optional(), // defaults to account email
});
