CREATE POLICY "Clients can view their court dates"
ON public.court_dates
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);

DROP POLICY IF EXISTS "Clients can upload documents" ON public.documents;
CREATE POLICY "Clients can upload documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);