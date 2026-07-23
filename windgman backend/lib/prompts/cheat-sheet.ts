import type { CheatSheetInput } from '@/lib/ai/provider';

export const CHEAT_SHEET_VERSION = 'sheet-v1';

export function cheatSheetPrompt(input: CheatSheetInput): string {
  const attempts = input.attempts
    .map((a, i) => `Q${i + 1}: ${a.question}\nTheir best answer: ${a.improved_answer ?? a.transcript}`)
    .join('\n\n');

  return `You are an interview coach producing a one-page printable cheat sheet the candidate will review right before walking in.

Use their resume, the job description, the gap analysis, and their practice answers below. Prefer wording from their own improved answers.

Produce:
- questions_theyll_ask: the 3 most likely questions + a one-line how_to_answer each
- star_stories: 3 stories (title + 1-line summary) drawn from their real experience
- perfect_introduction: a 30-second first-person intro pitch
- keywords: 5 keywords from the JD they should say out loud
- questions_to_ask: 3 smart reverse-interview questions
- company_name, job_title

RESUME:
${input.resume}

JOB DESCRIPTION:
${input.jd}

GAP ANALYSIS:
${JSON.stringify(input.gapAnalysis)}

PRACTICE ANSWERS:
${attempts || '(no practice attempts recorded)'}`;
}
