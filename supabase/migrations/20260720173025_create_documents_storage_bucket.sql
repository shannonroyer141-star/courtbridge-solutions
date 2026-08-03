INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Clients can upload their own intake documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.clients WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Clients can read their own storage documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.clients WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Providers can read their clients storage documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.clients WHERE provider_id = auth.uid())
);