import { Resend } from 'resend';
import { env } from '@/lib/env';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendCheatSheetEmail(to: string, companyName: string, pdf: Buffer) {
  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: `Your interview cheat sheet — ${companyName}`,
    html: `<p>You're ready. Your cheat sheet for <b>${companyName}</b> is attached.</p>
<p>Read it once tonight, once before you walk in. You've got this.</p>
<p>— The Pivot</p>`,
    attachments: [{ filename: 'interview-cheat-sheet.pdf', content: pdf }],
  });
}
