-- BIP participant file, fees, transfers, groups, make-up attendance, and 5-year retention.
-- Sources: Rule 65H-2.016(5), (6), (9)(c), F.A.C., and the DCF BIP Participant File Review
-- Checklist (BIP Monitoring Review Tools). Relies on can_manage_client() / is_bip_client()
-- from 20260928130000_bip_discharges.sql.

-- ---------------------------------------------------------------------------
-- Intake / participant file checklist: one row per BIP participant.
create table if not exists bip_intake (
  client_id uuid primary key references clients(id) on delete restrict,
  file_number text,
  county_of_residence text,
  photo_id_on_file boolean not null default false,                       -- (9)(c)1
  court_order_on_file boolean not null default false,                    -- (9)(c)2
  police_report_on_file text not null default 'no' check (police_report_on_file in ('yes', 'no', 'not_applicable')),
  rules_explained_at date,                                               -- (5)(b)1 fees, rules, confidentiality exceptions
  enrollment_form_completed_at date,                                     -- (5)(b)2 Participant Enrollment Form
  prior_bip_enrollment boolean not null default false,                   -- (5)(c) needs transfer approvals
  eligibility_screened_at date,                                          -- (5)(d)
  eligibility_result text check (eligibility_result in ('eligible', 'not_eligible')),
  orientation_attended_at date,                                          -- (5)(e)
  orientation_ack_signed boolean not null default false,                 -- (5)(e) signed acknowledgment in file
  assessment_completed_at date,                                          -- (5)(f), (9)(c)4
  assessment_recommendation text check (assessment_recommendation in ('none', 'mental_health', 'substance_abuse', 'both')),
  financial_assessment_at date,                                          -- (9)(c)3
  fee_reduced_or_waived boolean not null default false,                  -- (3) indigent policy
  limited_english boolean not null default false,                        -- (6)(h)
  lep_how_addressed text,                                                -- (6)(h) record how LEP was addressed
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz
);

alter table bip_intake enable row level security;
create policy "Staff view BIP intake" on bip_intake for select to authenticated using (can_manage_client(client_id));
create policy "Staff create BIP intake" on bip_intake for insert to authenticated with check (can_manage_client(client_id) and is_bip_client(client_id));
create policy "Staff update BIP intake" on bip_intake for update to authenticated using (can_manage_client(client_id)) with check (can_manage_client(client_id));
create trigger audit_bip_intake after insert or update or delete on bip_intake for each row execute function log_audit_event();

-- ---------------------------------------------------------------------------
-- Fee payments: (9)(c)6 record of payment of all fees, including dates and amounts.
create table if not exists bip_fee_payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  paid_on date not null default current_date,
  -- A correction is its own entry (negative to reverse a mistaken payment) so history is never rewritten.
  entry_type text not null default 'payment' check (entry_type in ('payment', 'correction')),
  amount numeric(10, 2) not null check (amount <> 0 and (entry_type = 'correction' or amount > 0)),
  note text,
  method text check (method in ('cash', 'card', 'check', 'money_order', 'other')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists bip_fee_payments_client_idx on bip_fee_payments(client_id, paid_on desc);

alter table bip_fee_payments enable row level security;
create policy "Staff view BIP fee payments" on bip_fee_payments for select to authenticated using (can_manage_client(client_id));
create policy "Staff record BIP fee payments" on bip_fee_payments for insert to authenticated
  with check (can_manage_client(client_id) and is_bip_client(client_id) and created_by = auth.uid());
-- No update/delete: payment history is part of the file. Mistakes are fixed with a correction entry.
create trigger audit_bip_fee_payments after insert or update or delete on bip_fee_payments for each row execute function log_audit_event();

-- ---------------------------------------------------------------------------
-- Transfers: (5)(c). A program may not enroll someone who is or was in another certified BIP
-- without written approval via email from the referral source, probation and parole (if
-- applicable), and the other program's director. After an approved transfer, the program the
-- participant was in sends an electronic copy of the file within 48 hours.
create table if not exists bip_transfers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  direction text not null check (direction in ('incoming', 'outgoing')),
  other_program text not null check (length(trim(other_program)) > 0),
  referral_source_approved_at date,
  probation_approval text not null default 'pending' check (probation_approval in ('pending', 'approved', 'not_applicable')),
  probation_approved_at date,
  program_director_approved_at date,
  approved_at timestamptz,        -- set by trigger once all required approvals are in
  file_due_at timestamptz,        -- outgoing only: approved_at + 48 hours
  file_sent_at timestamptz,       -- outgoing
  file_received_at timestamptz,   -- incoming
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz
);
create index if not exists bip_transfers_client_idx on bip_transfers(client_id);

create or replace function public.set_bip_transfer_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if NEW.referral_source_approved_at is not null
     and NEW.program_director_approved_at is not null
     and (NEW.probation_approval = 'not_applicable' or (NEW.probation_approval = 'approved' and NEW.probation_approved_at is not null))
  then
    -- Approved as of the latest approval date (end of that day is not assumed; start of day, Eastern).
    NEW.approved_at := (greatest(NEW.referral_source_approved_at, NEW.program_director_approved_at,
                                  coalesce(NEW.probation_approved_at, NEW.referral_source_approved_at))::timestamp
                        at time zone 'America/New_York');
    NEW.file_due_at := case when NEW.direction = 'outgoing' then NEW.approved_at + interval '48 hours' else null end;
  else
    NEW.approved_at := null;
    NEW.file_due_at := null;
  end if;
  if TG_OP = 'UPDATE' then
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$$;

create trigger bip_transfers_set_fields before insert or update on bip_transfers for each row execute function set_bip_transfer_fields();

alter table bip_transfers enable row level security;
create policy "Staff view BIP transfers" on bip_transfers for select to authenticated using (can_manage_client(client_id));
create policy "Staff record BIP transfers" on bip_transfers for insert to authenticated
  with check (can_manage_client(client_id) and is_bip_client(client_id) and created_by = auth.uid());
create policy "Staff update BIP transfers" on bip_transfers for update to authenticated using (can_manage_client(client_id)) with check (can_manage_client(client_id));
create trigger audit_bip_transfers after insert or update or delete on bip_transfers for each row execute function log_audit_event();

-- ---------------------------------------------------------------------------
-- Groups: (6)(d)-(g). Max 15 people single-facilitated, 23 co-facilitated; separate services
-- by sex or gender; virtual attendees on camera with audio.
create table if not exists bip_groups (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references profiles(id) default auth.uid(),
  name text not null check (length(trim(name)) > 0),
  gender text not null check (gender in ('men', 'women')),
  facilitation text not null check (facilitation in ('single', 'co')),
  format text not null default 'in_person' check (format in ('in_person', 'virtual', 'hybrid')),
  language text not null default 'English',
  schedule text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.can_manage_bip_group(p_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from bip_groups g
    join profiles me on me.id = auth.uid()
    left join profiles owner on owner.id = g.provider_id
    where g.id = p_group_id
      and coalesce(me.role, 'provider') <> 'client'
      and (g.provider_id = me.id or (owner.organization_id is not null and owner.organization_id = my_org_id_if_admin()))
  );
$$;
revoke all on function public.can_manage_bip_group(uuid) from public, anon;
grant execute on function public.can_manage_bip_group(uuid) to authenticated;

alter table bip_groups enable row level security;
-- Checks the row itself (not can_manage_bip_group) so INSERT ... RETURNING can see the new row.
create policy "Staff view BIP groups" on bip_groups for select to authenticated using (provider_id = auth.uid() or exists (select 1 from profiles owner where owner.id = bip_groups.provider_id and owner.organization_id is not null and owner.organization_id = my_org_id_if_admin()));
create policy "Staff create BIP groups" on bip_groups for insert to authenticated with check (provider_id = auth.uid());
create policy "Staff update BIP groups" on bip_groups for update to authenticated using (provider_id = auth.uid() or exists (select 1 from profiles owner where owner.id = bip_groups.provider_id and owner.organization_id is not null and owner.organization_id = my_org_id_if_admin())) with check (provider_id = auth.uid() or exists (select 1 from profiles owner where owner.id = bip_groups.provider_id and owner.organization_id is not null and owner.organization_id = my_org_id_if_admin()));

create table if not exists bip_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references bip_groups(id) on delete restrict,
  client_id uuid not null references clients(id) on delete restrict,
  joined_on date not null default current_date,
  left_on date,
  created_at timestamptz not null default now()
);
create unique index if not exists bip_group_members_one_active on bip_group_members(client_id) where left_on is null;

-- Enforce the group-size cap from (6)(e).
create or replace function public.enforce_bip_group_size()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cap int;
  v_count int;
begin
  if NEW.left_on is not null then
    return NEW;
  end if;
  select case when facilitation = 'co' then 23 else 15 end into v_cap from bip_groups where id = NEW.group_id;
  select count(*) into v_count from bip_group_members
  where group_id = NEW.group_id and left_on is null and id <> NEW.id;
  if v_count + 1 > v_cap then
    raise exception 'This group is full: Rule 65H-2.016(6)(e) allows at most % people in a %-facilitated group.',
      v_cap, case when v_cap = 23 then 'co' else 'single' end;
  end if;
  return NEW;
end;
$$;
revoke all on function public.enforce_bip_group_size() from public, anon, authenticated;
create trigger bip_group_members_size before insert or update on bip_group_members for each row execute function enforce_bip_group_size();

alter table bip_group_members enable row level security;
create policy "Staff view BIP group members" on bip_group_members for select to authenticated using (can_manage_bip_group(group_id));
create policy "Staff add BIP group members" on bip_group_members for insert to authenticated
  with check (can_manage_bip_group(group_id) and can_manage_client(client_id) and is_bip_client(client_id));
create policy "Staff update BIP group members" on bip_group_members for update to authenticated
  using (can_manage_bip_group(group_id)) with check (can_manage_bip_group(group_id));
create trigger audit_bip_group_members after insert or update or delete on bip_group_members for each row execute function log_audit_event();

-- ---------------------------------------------------------------------------
-- Attendance make-ups: (9)(c)5 record of sessions attended, missed, and made up.
alter table service_records drop constraint if exists service_records_attendance_status_check;
alter table service_records add constraint service_records_attendance_status_check
  check (attendance_status in ('attended', 'missed', 'excused', 'rescheduled', 'made_up'));
alter table service_records add column if not exists made_up_for_record_id uuid references service_records(id) on delete set null;

-- (6)(c): each program's policy must set the maximum unexcused absences before termination.
alter table profiles add column if not exists bip_max_unexcused_absences int check (bip_max_unexcused_absences is null or bip_max_unexcused_absences >= 0);

-- ---------------------------------------------------------------------------
-- 5-year retention: (9)(c) participant files are kept at least five years from discharge.
-- A BIP participant (and their attendance records) can't be deleted until 5 years after
-- their most recent discharge; one with no discharge on record can't be deleted at all.
create or replace function public.bip_retention_ends(p_client_id uuid)
returns timestamptz
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select max(discharge_at) + interval '5 years' from bip_discharges where client_id = p_client_id;
$$;
revoke all on function public.bip_retention_ends(uuid) from public, anon;
grant execute on function public.bip_retention_ends(uuid) to authenticated;

create or replace function public.block_bip_record_deletion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Read through jsonb: plpgsql errors on OLD.client_id when the row (clients) has no such column.
  v_client uuid := case when TG_TABLE_NAME = 'clients' then OLD.id else (to_jsonb(OLD)->>'client_id')::uuid end;
  v_until timestamptz;
begin
  if not exists (select 1 from clients where id = v_client and population_type = 'bip') then
    return OLD;
  end if;
  v_until := bip_retention_ends(v_client);
  if v_until is null or v_until > now() then
    raise exception 'BIP participant records must be kept at least 5 years from discharge (Rule 65H-2.016(9)(c)). %',
      case when v_until is null then 'No discharge is on record for this participant.' else 'Earliest deletion date: ' || to_char(v_until at time zone 'America/New_York', 'Mon DD, YYYY') end;
  end if;
  return OLD;
end;
$$;
revoke all on function public.block_bip_record_deletion() from public, anon, authenticated;

create trigger clients_bip_retention before delete on clients for each row execute function block_bip_record_deletion();
create trigger service_records_bip_retention before delete on service_records for each row execute function block_bip_record_deletion();
