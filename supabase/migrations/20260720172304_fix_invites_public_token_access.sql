CREATE POLICY "Anyone can read an active invite by token"
ON public.invites
FOR SELECT
TO anon, authenticated
USING (accepted = false AND expires_at > now());

CREATE POLICY "Anyone can accept an active invite by token"
ON public.invites
FOR UPDATE
TO anon, authenticated
USING (accepted = false AND expires_at > now())
WITH CHECK (true);