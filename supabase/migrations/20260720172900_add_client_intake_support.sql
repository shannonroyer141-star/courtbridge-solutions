ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS intake_complete boolean NOT NULL DEFAULT false;

CREATE POLICY "Clients can read their own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid()));

CREATE POLICY "Clients can update their own record"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());