import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/errors';
import { EmailBody } from '@/lib/schemas';
import { sendCheatSheetEmail } from '@/lib/email';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** POST /api/sessions/:id/email — email the generated cheat sheet. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireUser(req);
    const body = EmailBody.parse(await req.json().catch(() => ({})));

    const { data: session } = await auth.db
      .from('sessions').select('company_name, cheat_sheet_url').eq('id', params.id).maybeSingle();
    if (!session) throw new ApiError('not_found', 'Session not found.', 404);
    if (!session.cheat_sheet_url) throw new ApiError('no_cheat_sheet', 'Generate the cheat sheet first.', 409);

    const to = body.to ?? auth.email;
    if (!to) throw new ApiError('no_email', 'No destination email address.', 400);

    const { data: file, error } = await supabaseAdmin().storage
      .from('cheat-sheets').download(session.cheat_sheet_url);
    if (error || !file) throw new ApiError('download_failed', 'Could not fetch the PDF.', 502);

    await sendCheatSheetEmail(to, session.company_name ?? 'your interview', Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ sent: true, to });
  } catch (err) {
    return errorResponse(err);
  }
}
