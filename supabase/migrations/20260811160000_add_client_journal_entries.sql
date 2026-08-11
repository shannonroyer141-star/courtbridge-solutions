-- Private client journal ("My Thoughts") -- entries the client writes for themselves.
-- Intentionally has no provider, org admin, or founder read policy: this is private
-- to the client only, not even visible to their provider.

create table public.client_journal_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_journal_entries enable row level security;

create policy "Clients can view their own journal entries"
  on public.client_journal_entries for select
  to authenticated
  using (client_id in (select clients.id from public.clients where clients.auth_user_id = auth.uid()));

create policy "Clients can insert their own journal entries"
  on public.client_journal_entries for insert
  to authenticated
  with check (client_id in (select clients.id from public.clients where clients.auth_user_id = auth.uid()));

create policy "Clients can update their own journal entries"
  on public.client_journal_entries for update
  to authenticated
  using (client_id in (select clients.id from public.clients where clients.auth_user_id = auth.uid()))
  with check (client_id in (select clients.id from public.clients where clients.auth_user_id = auth.uid()));

create policy "Clients can delete their own journal entries"
  on public.client_journal_entries for delete
  to authenticated
  using (client_id in (select clients.id from public.clients where clients.auth_user_id = auth.uid()));
