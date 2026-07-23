/** Rough token estimate (~4 chars/token) and smart truncation to cap AI cost. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MAX_INPUT_TOKENS = 8000;

/** Truncate resume + JD so their combined size stays under the cap.
 *  Keeps the head of each document (most signal lives at the top). */
export function capInputs(resume: string, jd: string): { resume: string; jd: string } {
  const budget = MAX_INPUT_TOKENS * 4; // chars
  const total = resume.length + jd.length;
  if (total <= budget) return { resume, jd };
  const jdShare = Math.min(jd.length, Math.floor(budget * 0.4));
  const resumeShare = budget - jdShare;
  return {
    resume: resume.slice(0, resumeShare),
    jd: jd.slice(0, jdShare),
  };
}
