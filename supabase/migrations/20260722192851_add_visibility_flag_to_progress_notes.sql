alter table client_progress_notes add column if not exists visible_to_client boolean not null default true;

drop policy if exists "Providers and clients can view progress notes" on client_progress_notes;

create policy "Providers view all progress notes" on client_progress_notes for select
  using (client_id in (select id from clients where provider_id = auth.uid()));

create policy "Clients view only shared progress notes" on client_progress_notes for select
  using (
    visible_to_client = true
    and client_id in (select id from clients where auth_user_id = auth.uid())
  );