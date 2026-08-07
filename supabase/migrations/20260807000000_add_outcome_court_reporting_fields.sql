-- Statutory data fields for Florida problem-solving court outcome/compliance reporting (Chapter Law 2026-139 / SB 820).
-- Program-entry snapshot fields on clients.
alter table clients add column if not exists referral_source text;
alter table clients add column if not exists primary_offense text;
alter table clients add column if not exists screening_result text;
alter table clients add column if not exists eligibility_determination text;
alter table clients add column if not exists employment_status_admission text;
alter table clients add column if not exists housing_status_admission text;
alter table clients add column if not exists custody_status_admission text;

-- Program-level statutory court type (separate from clients.population_type, which drives app-side handling, not court reporting).
alter table client_programs add column if not exists court_program_type text
  check (court_program_type is null or court_program_type in ('drug_court', 'mental_health_court', 'veterans_treatment_court', 'early_childhood_court', 'other'));

-- Program-exit fields on client_programs.
alter table client_programs add column if not exists termination_reason text;
alter table client_programs add column if not exists employment_status_exit text;
alter table client_programs add column if not exists housing_status_exit text;
alter table client_programs add column if not exists custody_status_exit text;
alter table client_programs add column if not exists total_services_completed integer;
alter table client_programs add column if not exists total_units_completed numeric;

-- Ongoing-participation service/compliance records.
-- Stores the raw event, the provider's decision, and the resulting reporting status separately,
-- so a missed session isn't automatically treated as noncompliance.
create table if not exists service_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  client_program_id uuid references client_programs(id) on delete set null,
  provider_id uuid not null references auth.users(id),
  service_type text not null,
  service_date date not null default current_date,
  units numeric,
  attendance_status text check (attendance_status in ('attended', 'missed', 'excused', 'rescheduled')),
  event_notes text,
  compliance_status text not null default 'pending_review' check (compliance_status in ('compliant', 'noncompliant', 'pending_review')),
  reason_noncompliance text,
  new_offense_reported boolean not null default false,
  new_offense_details text,
  documentation_url text,
  entered_by uuid not null references auth.users(id),
  entered_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  updated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table service_records enable row level security;

create policy "Providers manage their clients' service records" on service_records for all
  using (client_id in (select id from clients where provider_id = auth.uid()))
  with check (client_id in (select id from clients where provider_id = auth.uid()));

create policy "Clients can view their own service records" on service_records for select
  using (client_id in (select id from clients where auth_user_id = auth.uid()));
