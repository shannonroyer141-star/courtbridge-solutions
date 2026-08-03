CREATE POLICY "Clients can log their own urgent sms" ON public.sms_logs
FOR INSERT
WITH CHECK (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);