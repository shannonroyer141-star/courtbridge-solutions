-- Preview: lets the founder role see read-only activity across ALL orgs (not just their own),
-- to prototype a platform-wide activity dashboard. Easy to revert: drop these 6 policies to undo.

create or replace function public.is_founder()
returns boolean
language sql
stable security definer
set search_path = public, pg_temp
as $$
  select coalesce((select is_founder from profiles where id = auth.uid()), false)
$$;

create policy "Founder preview: view all organizations"
  on public.organizations for select
  to authenticated
  using (public.is_founder());

create policy "Founder preview: view all clients"
  on public.clients for select
  to authenticated
  using (public.is_founder());

create policy "Founder preview: view all checkins"
  on public.checkins for select
  to authenticated
  using (public.is_founder());

create policy "Founder preview: view all messages"
  on public.messages for select
  to authenticated
  using (public.is_founder());

create policy "Founder preview: view all sms_logs"
  on public.sms_logs for select
  to authenticated
  using (public.is_founder());

create policy "Founder preview: view all profiles"
  on public.profiles for select
  to authenticated
  using (public.is_founder());
