-- Real system audit trail: automatically records who touched what, and when,
-- across the most sensitive tables. Database-level triggers (not app code) so
-- it can't be silently skipped by a bug or a missed call site. Nobody --
-- including admins -- can write directly into audit_log; only the trigger
-- function can, since it runs as the table owner and RLS never applies to
-- that role, the same pattern already used by is_founder()/my_org_id_if_admin().

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid references profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  client_id uuid references clients(id),
  organization_id uuid references organizations(id),
  old_data jsonb,
  new_data jsonb
);

create index if not exists audit_log_org_idx on audit_log(organization_id, occurred_at desc);
create index if not exists audit_log_client_idx on audit_log(client_id, occurred_at desc);
create index if not exists audit_log_actor_idx on audit_log(actor_id, occurred_at desc);

alter table audit_log enable row level security;

create policy "Founders can view all audit log entries"
  on audit_log for select
  to authenticated
  using (is_founder());

create policy "Org admins can view their org's audit log entries"
  on audit_log for select
  to authenticated
  using (organization_id = my_org_id_if_admin());

-- Belt-and-suspenders immutability: nobody gets UPDATE/DELETE on audit_log --
-- not through the API (no policy grants it, and RLS defaults to deny), and
-- not even via a direct SQL statement run as an admin/service role, because
-- this trigger blocks the write outright regardless of who's running it.
-- Once an entry exists, it exists forever -- that's the whole point of an
-- audit trail that has to hold up if anyone ever questions it.
create or replace function public.block_audit_log_tampering()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log entries cannot be modified or deleted -- this table is append-only by design';
end;
$$;

create trigger audit_log_is_immutable
  before update or delete on audit_log
  for each row execute function block_audit_log_tampering();

revoke update, delete on audit_log from public, anon, authenticated;

-- Generic trigger function: works across every target table below by reading
-- columns out of the row as jsonb instead of hardcoding each table's schema.
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb := to_jsonb(coalesce(NEW, OLD));
  v_client_id uuid := nullif(v_row->>'client_id', '')::uuid;
  v_provider_id uuid := nullif(v_row->>'provider_id', '')::uuid;
  v_org_id uuid := coalesce(
    nullif(v_row->>'organization_id', '')::uuid,
    nullif(v_row->>'target_org_id', '')::uuid
  );
begin
  if v_org_id is null and v_provider_id is not null then
    select organization_id into v_org_id from profiles where id = v_provider_id;
  end if;
  if v_org_id is null and v_client_id is not null then
    select p.organization_id into v_org_id
    from clients c join profiles p on p.id = c.provider_id
    where c.id = v_client_id;
  end if;

  insert into audit_log (actor_id, action, table_name, record_id, client_id, organization_id, old_data, new_data)
  values (
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    coalesce(nullif(v_row->>'id', '')::uuid, null),
    v_client_id,
    v_org_id,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(OLD) else null end,
    case when TG_OP in ('UPDATE', 'INSERT') then to_jsonb(NEW) else null end
  );
  return coalesce(NEW, OLD);
end;
$$;

revoke all on function public.log_audit_event() from public;

-- Client records, case/clinical notes, messages, violation reports, and
-- cross-agency records requests: every insert/update/delete is logged.
create trigger audit_clients
  after insert or update or delete on clients
  for each row execute function log_audit_event();

create trigger audit_case_notes
  after insert or update or delete on case_notes
  for each row execute function log_audit_event();

create trigger audit_clinical_notes
  after insert or update or delete on clinical_notes
  for each row execute function log_audit_event();

create trigger audit_messages
  after insert or update or delete on messages
  for each row execute function log_audit_event();

create trigger audit_violation_reports
  after insert or update or delete on violation_reports
  for each row execute function log_audit_event();

create trigger audit_records_access_requests
  after insert or update or delete on records_access_requests
  for each row execute function log_audit_event();

-- Staff/role changes: only log profile updates when something that actually
-- matters for access control changes -- not every routine self-edit like a
-- display name or theme preference.
create trigger audit_profiles_role_changes
  after update on profiles
  for each row
  when (
    old.is_org_admin is distinct from new.is_org_admin
    or old.is_founder is distinct from new.is_founder
    or old.org_role is distinct from new.org_role
    or old.organization_id is distinct from new.organization_id
    or old.account_status is distinct from new.account_status
  )
  execute function log_audit_event();
