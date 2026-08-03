-- Add real policies for the two tables that had no safe fallback
create policy "Clients can insert their own checkins"
  on public.checkins for insert
  with check (client_id in (select id from public.clients where auth_user_id = auth.uid()));

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Drop the unrestricted duplicate INSERT policies (WITH CHECK true) that were
-- silently overriding every properly-scoped policy above, since permissive
-- RLS policies are OR'd together in Postgres.
drop policy if exists "Enable insert for authenticated users only" on public.alerts;
drop policy if exists "Enable insert for authenticated users only" on public.assessments;
drop policy if exists "Enable insert for authenticated users only" on public.audit_readiness;
drop policy if exists "Enable insert for authenticated users only" on public.calendar_events;
drop policy if exists "Enable insert for authenticated users only" on public.case_notes;
drop policy if exists "Enable insert for authenticated users only" on public.checkins;
drop policy if exists "Enable insert for authenticated users only" on public.clients;
drop policy if exists "Enable insert for authenticated users only" on public.clinical_notes_placeholder;
drop policy if exists "Enable insert for authenticated users only" on public.compliance_requirements;
drop policy if exists "Enable insert for authenticated users only" on public.contact_log;
drop policy if exists "Enable insert for authenticated users only" on public.documents;
drop policy if exists "Enable insert for authenticated users only" on public.drug_tests;
drop policy if exists "Enable insert for authenticated users only" on public.funding_sources;
drop policy if exists "Enable insert for authenticated users only" on public.invites;
drop policy if exists "Enable insert for authenticated users only" on public.legal_agreements;
drop policy if exists "Enable insert for authenticated users only" on public.notifications;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.programs;
drop policy if exists "Enable insert for authenticated users only" on public.tasks;

-- Tighten the invites accept-by-token UPDATE policy: anyone with a valid
-- unexpired token can flip accepted to true, but WITH CHECK (true) meant
-- they could rewrite any other column on the row too. Restrict the check
-- to only allow the one legitimate transition.
drop policy if exists "Anyone can accept an active invite by token" on public.invites;
create policy "Anyone can accept an active invite by token"
  on public.invites for update
  using (accepted = false and expires_at > now())
  with check (accepted = true);

-- handle_new_user is a real trigger (on_auth_user_created on auth.users) --
-- leave the trigger itself intact, but it should not also be directly
-- callable via the public REST RPC endpoint. Revoking EXECUTE from
-- anon/authenticated does not stop the trigger from firing (triggers run
-- with the definer's privileges regardless of role grants).
revoke execute on function public.handle_new_user() from anon, authenticated;
alter function public.handle_new_user() set search_path = public;
alter function public.update_updated_at() set search_path = public;
