-- BIP discharge workflow (Florida Rule 65H-2.016(7), F.A.C.).
-- (7)(a): three discharge categories -- completion, termination, transfer.
-- (7)(b): document the reason(s) in the participant's file, inform the victim per (8)(c)
--         (24 hours -- handled by victim_notifications), and inform the referral source and
--         probation and parole, if applicable, in writing, within three business days.

-- Shared helper: end of day (Eastern) N business days after an event. Saturdays and Sundays
-- are skipped; holidays are not (Rule 65H-2 does not define which holidays count).
create or replace function public.business_days_due(p_event_at timestamptz, p_days int)
returns timestamptz
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  d date := (p_event_at at time zone 'America/New_York')::date;
  added int := 0;
begin
  while added < p_days loop
    d := d + 1;
    if extract(isodow from d) < 6 then
      added := added + 1;
    end if;
  end loop;
  return ((d + time '23:59:59') at time zone 'America/New_York');
end;
$$;

-- Shared helper: is the current user the participant's provider, or an org admin of the
-- provider's organization? Participants (role = 'client') never pass.
create or replace function public.can_manage_client(p_client_id uuid)
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
      and coalesce(me.role, 'provider') <> 'client'
      and coalesce(me.account_status, 'active') = 'active'
      and (
        c.provider_id = me.id
        or (prov.organization_id is not null and prov.organization_id = my_org_id_if_admin())
      )
  );
$$;

create or replace function public.is_bip_client(p_client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from clients where id = p_client_id and population_type = 'bip');
$$;

revoke all on function public.business_days_due(timestamptz, int) from public, anon;
revoke all on function public.can_manage_client(uuid) from public, anon;
revoke all on function public.is_bip_client(uuid) from public, anon;
grant execute on function public.business_days_due(timestamptz, int) to authenticated;
grant execute on function public.can_manage_client(uuid) to authenticated;
grant execute on function public.is_bip_client(uuid) to authenticated;

-- ---------------------------------------------------------------------------
create table if not exists bip_discharges (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  client_program_id uuid references client_programs(id) on delete set null,
  discharge_at timestamptz not null,
  category text not null check (category in ('completion', 'termination', 'transfer')),
  -- (7)(b)1: document the reason(s) for discharge. Participant information only.
  reason_details text not null check (length(trim(reason_details)) > 0),
  transfer_program text,
  referral_source_name text,
  report_due_at timestamptz not null,
  referral_report_sent_at timestamptz,
  referral_report_method text check (referral_report_method in ('email', 'mail', 'fax', 'hand_delivered', 'electronic_filing')),
  probation_applicable boolean not null default false,
  probation_report_sent_at timestamptz,
  probation_report_method text check (probation_report_method in ('email', 'mail', 'fax', 'hand_delivered', 'electronic_filing')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz,
  constraint transfer_needs_program check (category <> 'transfer' or length(trim(coalesce(transfer_program, ''))) > 0)
);

create index if not exists bip_discharges_client_idx on bip_discharges(client_id, discharge_at desc);
create unique index if not exists bip_discharges_one_per_program on bip_discharges(client_program_id) where client_program_id is not null;

create or replace function public.set_bip_discharge_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  NEW.report_due_at := business_days_due(NEW.discharge_at, 3);
  if TG_OP = 'UPDATE' then
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$;

create trigger bip_discharges_set_fields
  before insert or update on bip_discharges
  for each row execute function set_bip_discharge_fields();

-- On discharge: start the 24-hour victim notice clock and close out the program order.
-- Security definer so the victim-notice clock starts even when the discharging staff member
-- doesn't hold victim-notification access (no victim information is written here).
create or replace function public.after_bip_discharge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into victim_notifications (client_id, notice_type, event_at, discharge_reason, due_at, created_by)
  values (NEW.client_id, 'discharge', NEW.discharge_at, NEW.category, NEW.discharge_at, coalesce(auth.uid(), NEW.created_by));

  if NEW.client_program_id is not null then
    update client_programs
    set status = case when NEW.category = 'completion' then 'completed' else 'terminated' end,
        completed_at = NEW.discharge_at,
        termination_reason = case when NEW.category = 'completion' then termination_reason else NEW.category || ': ' || NEW.reason_details end
    where id = NEW.client_program_id and client_id = NEW.client_id;
  end if;
  return NEW;
end;
$$;
revoke all on function public.after_bip_discharge() from public, anon, authenticated;

create trigger bip_discharges_after_insert
  after insert on bip_discharges
  for each row execute function after_bip_discharge();

alter table bip_discharges enable row level security;

create policy "Staff view BIP discharges" on bip_discharges for select
  to authenticated
  using (can_manage_client(client_id));

create policy "Staff record BIP discharges" on bip_discharges for insert
  to authenticated
  with check (can_manage_client(client_id) and is_bip_client(client_id) and created_by = auth.uid());

create policy "Staff update BIP discharges" on bip_discharges for update
  to authenticated
  using (can_manage_client(client_id))
  with check (can_manage_client(client_id));

-- No delete policy: the discharge report is part of the participant file (65H-2.016(9)(c)9).

create trigger audit_bip_discharges
  after insert or update or delete on bip_discharges
  for each row execute function log_audit_event();
