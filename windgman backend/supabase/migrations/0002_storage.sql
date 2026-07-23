-- Buckets (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('cheat-sheets', 'cheat-sheets', false, 10485760, ARRAY['application/pdf']),
  ('recordings', 'recordings', false, 15728640, ARRAY['audio/webm','audio/mp4','audio/m4a','audio/x-m4a'])
ON CONFLICT (id) DO NOTHING;

-- Users can only touch files under their own uid/ prefix
CREATE POLICY "own files read" ON storage.objects FOR SELECT
  USING (bucket_id IN ('resumes','cheat-sheets','recordings') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files write" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('resumes','recordings') AND (storage.foldername(name))[1] = auth.uid()::text);

-- Auto-delete recordings older than 7 days (requires pg_cron extension)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'purge-old-recordings', '0 3 * * *',
  $$ DELETE FROM storage.objects WHERE bucket_id = 'recordings' AND created_at < NOW() - INTERVAL '7 days' $$
);
