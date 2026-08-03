CREATE POLICY "Clients can read their own record"
ON public.clients
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());