export const GAP_ANALYSIS_VERSION = 'gap-v1';

export function gapAnalysisPrompt(resume: string, jd: string): string {
  return `You are an encouraging, sharp interview coach. A candidate has an interview in a few days.

Compare their RESUME against the JOB DESCRIPTION and produce:

1. gap_analysis.critical — skills/requirements the JD emphasizes that the resume lacks. For each: finding, evidence (quote or count from the JD, e.g. "mentioned 5 times"), likely_question (how the interviewer will probe it).
2. gap_analysis.weak — vague or unquantified achievements. For each: finding, example_before (their phrasing), example_after (stronger, metric-driven rewrite).
3. gap_analysis.strengths — resume strengths that map directly to what the JD wants. For each: finding, likely_question.
4. questions — exactly 7 interview questions they should practice, mixing categories ("critical", "weak", "strength"), each with a one-sentence strategic tip. Questions must reference the candidate's actual background, not be generic.
5. company_name and job_title extracted from the JD (best guess if absent).

Tone: specific, warm, confidence-building. Never invent resume content.

RESUME:
${resume}

JOB DESCRIPTION:
${jd}`;
}
