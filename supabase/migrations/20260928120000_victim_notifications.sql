-- Victim Notifications for certified Batterers' Intervention Programs (Policies section 5).
-- Florida Rule 65H-2.016(8), F.A.C., requires a BIP to notify (or attempt to notify) the victim
-- within 3 business days of a participant's enrollment and within 24 hours of discharge, and to
-- keep a dated record of each notice. This is the ONE place victim information is allowed.
--
-- Design:
-- * victim_contacts holds the only victim-identifying data (name + one contact method). It has
--   RLS on and NO policies, and table privileges are revoked, so nothing reads or writes it
--   directly through the API. All access goes through the security definer functions below,
--   which check permission and write a "view" entry to audit_log on every read.
-- * victim_notifications holds the notice records (dates, method, checklist). No victim
--   name or contact info lives there, so it is safe to show in the participant's file and to
--   audit with the standard log_audit_event() trigger.
-- * Participants (role = 'client') can never pass the access check.
-- * victim_contacts gets its own audit trigger that records WHICH fields changed but never
--   copies the name or contact value into audit_log (org admins can read audit_log).

-- ---------------------------------------------------------------------------
-- Permission flag, granted by an org admin.
alter table profiles add column if not exists can_manage_victim_notifications boolean not null default false;

-- Extend the self-escalation guard so a non-admin can't grant themselves victim access.
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() = OLD.id
     and not coalesce(OLD.is_org_admin, false)
     and not coalesce(OLD.is_founder, false)
  then
    if NEW.account_status is distinct from OLD.account_status
       or NEW.is_org_admin is distinct from OLD.is_org_admin
       or NEW.org_role is distinct from OLD.org_role
       or NEW.is_founder is distinct from OLD.is_founder
       or NEW.organization_id is distinct from OLD.organization_id
       or NEW.role is distinct from OLD.role
       or NEW.can_manage_victim_notifications is distinct from OLD.can_manage_victim_notifications
    then
      raise exception 'You do not have permission to change this on your own account. Ask an org admin.';
    end if;
  end if;
  return NEW;
end;
$$;
revoke execute on function public.prevent_self_privilege_escalation() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Access checks.

-- Screen-level: does the current user hold victim-notification access at all?
create or replace function public.has_victim_notification_access()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and coalesce(p.role, 'provider') <> 'client'
      and coalesce(p.account_status, 'active') = 'active'
      and (p.can_manage_victim_notifications or p.is_org_admin or p.is_founder)
  );
$$;

-- Record-level: may the current user see/record victim notifications for this participant?
-- Only for BIP participants. Allowed: the participant's own provider with the permission flag,
-- or an org admin of the provider's organization.
create or replace function public.can_access_victim_info(p_client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from clients c
    join profiles me on me.id = auth.uid()
    left join profiles prov on prov.id = c.provider_id
    where c.id = p_client_id
      and c.population_type = 'bip'
      and coalesce(me.role, 'provider') <> 'client'
      and coalesce(me.account_status, 'active') = 'active'
      and (
        (c.provider_id = me.id and me.can_manage_victim_notifications)
        or (prov.organization_id is not null and prov.organization_id = my_org_id_if_admin())
      )
  );
$$;

revoke all on function public.has_victim_notification_access() from public, anon;
revoke all on function public.can_access_victim_info(uuid) from public, anon;
grant execute on function public.has_victim_notification_access() to authenticated;
grant execute on function public.can_access_victim_info(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- victim_contacts: the only victim-identifying data in CourtBridge.
create table if not exists victim_contacts (
  id uuid primary key default gen_random_uuid(),
  -- restrict, not cascade: participant files (including notices) are kept 5 years after
  -- discharge (65H-2.016(9)(c)), so a BIP participant with victim records can't be deleted.
  client_id uuid not null references clients(id) on delete restrict,
  victim_name text not null check (length(trim(victim_name)) > 0),
  contact_method text not null check (contact_method in ('mail', 'email', 'phone')),
  contact_value text not null check (length(trim(contact_value)) > 0),
  -- 65H-2.016(8)(a): must come from the referral source or other sources such as court
  -- documents or police reports. Never from the participant, so there is no such option.
  info_source text not null check (info_source in ('referral_source', 'court_documents', 'police_report')),
  wants_updates text not null default 'not_yet_asked' check (wants_updates in ('yes', 'no', 'not_yet_asked')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz
);

create index if not exists victim_contacts_client_idx on victim_contacts(client_id);

alter table victim_contacts enable row level security;
-- Intentionally no policies: direct API access is denied. Use the functions below.
revoke all on victim_contacts from public, anon, authenticated;

-- Redacted audit trail for victim_contacts: logs who, when, and which fields changed,
-- never the victim's name or contact value.
create or replace function public.log_victim_contact_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row victim_contacts := coalesce(NEW, OLD);
  v_org uuid;
  v_changed text[] := '{}';
begin
  select p.organization_id into v_org
  from clients c join profiles p on p.id = c.provider_id
  where c.id = v_row.client_id;

  if TG_OP = 'UPDATE' then
    if NEW.victim_name is distinct from OLD.victim_name then v_changed := v_changed || 'victim_name'; end if;
    if NEW.contact_method is distinct from OLD.contact_method then v_changed := v_changed || 'contact_method'; end if;
    if NEW.contact_value is distinct from OLD.contact_value then v_changed := v_changed || 'contact_value'; end if;
    if NEW.info_source is distinct from OLD.info_source then v_changed := v_changed || 'info_source'; end if;
    if NEW.wants_updates is distinct from OLD.wants_updates then v_changed := v_changed || 'wants_updates'; end if;
  end if;

  insert into audit_log (actor_id, action, table_name, record_id, client_id, organization_id, old_data, new_data)
  values (
    auth.uid(),
    lower(TG_OP),
    'victim_contacts',
    v_row.id,
    v_row.client_id,
    v_org,
    null,
    jsonb_build_object(
      'redacted', true,
      'contact_method', v_row.contact_method,
      'info_source', v_row.info_source,
      'wants_updates', v_row.wants_updates,
      'fields_changed', to_jsonb(v_changed)
    )
  );
  return coalesce(NEW, OLD);
end;
$$;
revoke all on function public.log_victim_contact_event() from public, anon, authenticated;

create trigger audit_victim_contacts
  after insert or update or delete on victim_contacts
  for each row execute function log_victim_contact_event();

-- Read victim contacts for one participant. Every call is logged as a "view".
create or replace function public.get_victim_contacts(p_client_id uuid)
returns setof victim_contacts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
begin
  if not can_access_victim_info(p_client_id) then
    raise exception 'You do not have access to victim notification records for this participant.';
  end if;

  select p.organization_id into v_org
  from clients c join profiles p on p.id = c.provider_id
  where c.id = p_client_id;

  insert into audit_log (actor_id, action, table_name, record_id, client_id, organization_id, old_data, new_data)
  values (auth.uid(), 'view', 'victim_contacts', null, p_client_id, v_org, null, jsonb_build_object('redacted', true));

  return query select * from victim_contacts where client_id = p_client_id order by created_at;
end;
$$;

-- Create (p_id null) or update a victim contact. Returns the contact id.
create or replace function public.save_victim_contact(
  p_id uuid,
  p_client_id uuid,
  p_victim_name text,
  p_contact_method text,
  p_contact_value text,
  p_info_source text,
  p_wants_updates text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not can_access_victim_info(p_client_id) then
    raise exception 'You do not have access to victim notification records for this participant.';
  end if;

  if p_id is null then
    insert into victim_contacts (client_id, victim_name, contact_method, contact_value, info_source, wants_updates, created_by)
    values (p_client_id, trim(p_victim_name), p_contact_method, trim(p_contact_value), p_info_source, coalesce(p_wants_updates, 'not_yet_asked'), auth.uid())
    returning id into v_id;
  else
    update victim_contacts
    set victim_name = trim(p_victim_name),
        contact_method = p_contact_method,
        contact_value = trim(p_contact_value),
        info_source = p_info_source,
        wants_updates = coalesce(p_wants_updates, wants_updates),
        updated_by = auth.uid(),
        updated_at = now()
    where id = p_id and client_id = p_client_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Victim contact not found for this participant.';
    end if;
  end if;
  return v_id;
end;
$$;

revoke all on function public.get_victim_contacts(uuid) from public, anon;
revoke all on function public.save_victim_contact(uuid, uuid, text, text, text, text, text) from public, anon;
grant execute on function public.get_victim_contacts(uuid) to authenticated;
grant execute on function public.save_victim_contact(uuid, uuid, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- victim_notifications: the dated notice records. No victim name or contact info here.

-- Deadline per 65H-2.016(8): enrollment = 3 business days after the enrollment date
-- (end of that day, Eastern time; Saturdays and Sundays skipped -- the rule does not list
-- holidays, so holidays are NOT skipped); discharge = 24 hours after the discharge time.
create or replace function public.victim_notice_due_at(p_notice_type text, p_event_at timestamptz)
returns timestamptz
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  d date := (p_event_at at time zone 'America/New_York')::date;
  added int := 0;
begin
  if p_notice_type = 'discharge' then
    return p_event_at + interval '24 hours';
  end if;
  while added < 3 loop
    d := d + 1;
    if extract(isodow from d) < 6 then
      added := added + 1;
    end if;
  end loop;
  return ((d + time '23:59:59') at time zone 'America/New_York');
end;
$$;

create table if not exists victim_notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  victim_contact_id uuid references victim_contacts(id) on delete restrict,
  notice_type text not null check (notice_type in ('enrollment', 'discharge')),
  event_at timestamptz not null,
  discharge_reason text check (discharge_reason in ('completion', 'termination', 'transfer')),
  due_at timestamptz not null,
  -- 65H-2.016(8)(b) allows letter/email/phone for enrollment; (8)(c) requires electronic
  -- or telephonic communication for discharge (enforced in the trigger below).
  method text check (method in ('letter', 'email', 'phone')),
  outcome text check (outcome in ('sent', 'attempted')),
  completed_at timestamptz,
  -- Required content checklist.
  included_dv_center boolean not null default false,
  included_law_enforcement boolean not null default false,
  included_probation text not null default 'no' check (included_probation in ('yes', 'no', 'not_applicable')),
  included_state_attorney boolean not null default false,
  included_program_goals boolean not null default false,       -- enrollment only
  included_not_privileged boolean not null default false,      -- enrollment only (s. 90.5036, F.S.)
  asked_update_preference boolean not null default false,      -- enrollment only
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz,
  constraint discharge_needs_reason check (notice_type <> 'discharge' or discharge_reason is not null),
  constraint completed_needs_details check (completed_at is null or (method is not null and outcome is not null))
);

create index if not exists victim_notifications_client_idx on victim_notifications(client_id, event_at desc);
create index if not exists victim_notifications_open_idx on victim_notifications(due_at) where completed_at is null;

create or replace function public.set_victim_notice_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  NEW.due_at := victim_notice_due_at(NEW.notice_type, NEW.event_at);
  if NEW.notice_type = 'discharge' and NEW.method = 'letter' then
    raise exception 'Discharge notices must be sent by email or phone (Rule 65H-2.016(8)(c)).';
  end if;
  if TG_OP = 'UPDATE' then
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$;

create trigger victim_notifications_set_fields
  before insert or update on victim_notifications
  for each row execute function set_victim_notice_fields();

alter table victim_notifications enable row level security;

create policy "Authorized staff view victim notifications" on victim_notifications for select
  to authenticated
  using (can_access_victim_info(client_id));

create policy "Authorized staff record victim notifications" on victim_notifications for insert
  to authenticated
  with check (can_access_victim_info(client_id) and created_by = auth.uid());

create policy "Authorized staff update victim notifications" on victim_notifications for update
  to authenticated
  using (can_access_victim_info(client_id))
  with check (can_access_victim_info(client_id));

-- No delete policy: notice records are part of the participant file and must be kept.

create trigger audit_victim_notifications
  after insert or update or delete on victim_notifications
  for each row execute function log_audit_event();
