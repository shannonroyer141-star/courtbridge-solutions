CREATE POLICY "Clients and providers can read relevant checkins"
ON public.checkins
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid())
  OR
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);