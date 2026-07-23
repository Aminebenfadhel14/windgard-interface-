import { env } from '@/lib/env';
import { ApiError } from '@/lib/errors';

/** Whisper transcription via the OpenAI API. */
export async function transcribe(audio: Blob, filename: string): Promise<string> {
  const form = new FormData();
  form.append('file', audio, filename);
  form.append('model', 'whisper-1');
  form.append('language', 'en');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error('whisper error', res.status, await res.text());
    throw new ApiError('transcription_failed', 'Could not transcribe your recording. Please try again.', 502);
  }
  const data = (await res.json()) as { text: string };
  if (!data.text?.trim()) throw new ApiError('empty_transcript', 'We could not hear anything in that recording.', 422);
  return data.text.trim();
}
