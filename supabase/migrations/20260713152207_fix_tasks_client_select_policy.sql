DROP POLICY IF EXISTS "Clients can view and complete their tasks" ON public.tasks;
CREATE POLICY "Clients can view their tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
);