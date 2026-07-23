import { ApiError } from '@/lib/errors';

const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_BYTES = 5 * 1024 * 1024;

/** Extract plain text from an uploaded resume (PDF or DOCX). */
export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new ApiError('file_too_large', 'Resume must be under 5 MB.', 413);
  if (![PDF_MIME, DOCX_MIME].includes(file.type)) {
    throw new ApiError('unsupported_type', 'Please upload a PDF or DOCX resume.', 415);
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Cheap magic-byte check on top of MIME
  if (file.type === PDF_MIME && !buf.subarray(0, 5).toString('ascii').startsWith('%PDF')) {
    throw new ApiError('unsupported_type', 'That file is not a valid PDF.', 415);
  }

  let text: string;
  if (file.type === PDF_MIME) {
    const pdfParse = (await import('pdf-parse')).default;
    text = (await pdfParse(buf)).text;
  } else {
    const mammoth = await import('mammoth');
    text = (await mammoth.extractRawText({ buffer: buf })).value;
  }

  const cleaned = text.replace(/\s+\n/g, '\n').trim();
  if (cleaned.length < 100) {
    throw new ApiError('empty_resume', 'We could not read text from that resume. Is it a scanned image?', 422);
  }
  return cleaned;
}
