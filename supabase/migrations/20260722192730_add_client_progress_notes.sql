create table if not exists client_progress_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  note_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now()
);

alter table client_progress_notes enable row level security;

create policy "Providers and clients can view progress notes" on client_progress_notes for select
  using (
    client_id in (select id from clients where provider_id = auth.uid())
    or client_id in (select id from clients where auth_user_id = auth.uid())
  );
create policy "Providers manage progress notes" on client_progress_notes for insert
  with check (client_id in (select id from clients where provider_id = auth.uid()));
create policy "Providers update progress notes" on client_progress_notes for update
  using (client_id in (select id from clients where provider_id = auth.uid()));
create policy "Providers delete progress notes" on client_progress_notes for delete
  using (client_id in (select id from clients where provider_id = auth.uid()));