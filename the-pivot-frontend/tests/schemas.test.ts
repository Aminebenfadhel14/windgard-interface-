import { describe, it, expect } from 'vitest';
import { GapAnalysisSchema, ScoreSchema, CreateSessionBody } from '@/lib/schemas';

const validGap = {
  company_name: 'Acme', job_title: 'Senior Engineer',
  gap_analysis: {
    critical: [{ finding: 'No AWS', evidence: 'mentioned 5 times', likely_question: 'How…?' }],
    weak: [{ finding: 'Vague wins', example_before: 'improved efficiency', example_after: 'cut deploy time 40%' }],
    strengths: [{ finding: 'Led 12', likely_question: 'Tell me…' }],
  },
  questions: Array.from({ length: 7 }, (_, i) => ({ text: `Q${i}`, category: 'critical', tip: 'tip' })),
};

describe('GapAnalysisSchema', () => {
  it('accepts a valid payload', () => {
    expect(GapAnalysisSchema.safeParse(validGap).success).toBe(true);
  });
  it('rejects wrong question count', () => {
    const bad = { ...validGap, questions: validGap.questions.slice(0, 5) };
    expect(GapAnalysisSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects unknown category', () => {
    const bad = { ...validGap, questions: validGap.questions.map(q => ({ ...q, category: 'other' })) };
    expect(GapAnalysisSchema.safeParse(bad).success).toBe(false);
  });
});

describe('ScoreSchema', () => {
  it('rejects out-of-range scores', () => {
    const bad = { scores: { clarity: 11, relevance: 5, structure: 5, confidence: 5 }, summary: 's', improved_answer: 'a' };
    expect(ScoreSchema.safeParse(bad).success).toBe(false);
  });
});

describe('CreateSessionBody', () => {
  it('rejects a too-short JD', () => {
    expect(CreateSessionBody.safeParse({ job_description_text: 'short' }).success).toBe(false);
  });
  it('defaults consent to false', () => {
    const r = CreateSessionBody.parse({ job_description_text: 'x'.repeat(60) });
    expect(r.consent_training).toBe(false);
  });
});
