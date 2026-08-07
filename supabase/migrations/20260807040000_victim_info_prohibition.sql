-- Victim Information Prohibition: flagging + restriction workflow (section 6 of the policy).
-- Restricted rows become invisible to ordinary providers/clients at the RLS level (not just
-- hidden in the UI), and only visible to an org admin or founder ("authorized privacy
-- administrator") until reviewed. Existing policies are preserved exactly, with
-- "AND restricted = false" added to their USING clause so no other access logic changes.

create table if not exists victim_info_flags (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  client_id uuid references clients(id) on delete set null,
  flagged_by uuid not null references auth.users(id),
  flagged_at timestamptz not null default now(),
  reason text,
  status text not null default 'restricted' check (status in ('restricted', 'reviewed', 'removed', 'retained_legal_hold', 'replaced')),
  legal_hold boolean not null default false,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now()
);

alter table victim_info_flags enable row level security;

create policy "Privacy admins manage victim info flags" on victim_info_flags for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

create policy "Providers can flag their own clients' records" on victim_info_flags for insert
  with check (flagged_by = auth.uid());

-- ---------------------------------------------------------------------------
-- case_notes
alter table case_notes add column if not exists restricted boolean not null default false;
drop policy if exists "Providers can manage case notes" on case_notes;
create policy "Providers can manage case notes" on case_notes for all
  using (auth.uid() = provider_id and restricted = false);
create policy "Privacy admins can review restricted case notes" on case_notes for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- clinical_notes
alter table clinical_notes add column if not exists restricted boolean not null default false;
drop policy if exists "Providers can manage clinical notes" on clinical_notes;
create policy "Providers can manage clinical notes" on clinical_notes for all
  using (auth.uid() = provider_id and restricted = false)
  with check (auth.uid() = provider_id);
create policy "Privacy admins can review restricted clinical notes" on clinical_notes for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- client_progress_notes
alter table client_progress_notes add column if not exists restricted boolean not null default false;
drop policy if exists "Clients view only shared progress notes" on client_progress_notes;
create policy "Clients view only shared progress notes" on client_progress_notes for select
  using (visible_to_client = true and restricted = false and client_id in (select id from clients where auth_user_id = auth.uid()));
drop policy if exists "Providers view all progress notes" on client_progress_notes;
create policy "Providers view all progress notes" on client_progress_notes for select
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Providers update progress notes" on client_progress_notes;
create policy "Providers update progress notes" on client_progress_notes for update
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Providers delete progress notes" on client_progress_notes;
create policy "Providers delete progress notes" on client_progress_notes for delete
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
create policy "Privacy admins can review restricted progress notes" on client_progress_notes for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- contact_log
alter table contact_log add column if not exists restricted boolean not null default false;
drop policy if exists "Providers can manage contact log" on contact_log;
create policy "Providers can manage contact log" on contact_log for all
  using (auth.uid() = provider_id and restricted = false);
create policy "Privacy admins can review restricted contact log" on contact_log for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- court_dates
alter table court_dates add column if not exists restricted boolean not null default false;
drop policy if exists "Providers access own court_dates" on court_dates;
create policy "Providers access own court_dates" on court_dates for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Providers see own court_dates" on court_dates;
create policy "Providers see own court_dates" on court_dates for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Clients can view their court dates" on court_dates;
create policy "Clients can view their court dates" on court_dates for select
  using (restricted = false and client_id in (select id from clients where auth_user_id = auth.uid()));
create policy "Privacy admins can review restricted court dates" on court_dates for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- cps_cases
alter table cps_cases add column if not exists restricted boolean not null default false;
drop policy if exists "Providers access own cps_cases" on cps_cases;
create policy "Providers access own cps_cases" on cps_cases for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Providers see own cps_cases" on cps_cases;
create policy "Providers see own cps_cases" on cps_cases for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
create policy "Privacy admins can review restricted cps_cases" on cps_cases for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- documents
alter table documents add column if not exists restricted boolean not null default false;
alter table documents add column if not exists victim_check_confirmed boolean not null default false;
alter table documents add column if not exists victim_check_confirmed_by uuid references auth.users(id);
alter table documents add column if not exists victim_check_confirmed_at timestamptz;
drop policy if exists "Providers can manage documents" on documents;
create policy "Providers can manage documents" on documents for all
  using (auth.uid() = provider_id and restricted = false);
drop policy if exists "Clients can read their own documents" on documents;
create policy "Clients can read their own documents" on documents for select
  using (restricted = false and client_id in (select id from clients where auth_user_id = auth.uid()));
create policy "Privacy admins can review restricted documents" on documents for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- meeting_log
alter table meeting_log add column if not exists restricted boolean not null default false;
drop policy if exists "Providers access own meeting_log" on meeting_log;
create policy "Providers access own meeting_log" on meeting_log for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Providers see own meeting_log" on meeting_log;
create policy "Providers see own meeting_log" on meeting_log for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
create policy "Privacy admins can review restricted meeting_log" on meeting_log for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- po_visits
alter table po_visits add column if not exists restricted boolean not null default false;
drop policy if exists "Providers access own po_visits" on po_visits;
create policy "Providers access own po_visits" on po_visits for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Providers see own po_visits" on po_visits;
create policy "Providers see own po_visits" on po_visits for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
create policy "Privacy admins can review restricted po_visits" on po_visits for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- records_access_requests (JCX)
alter table records_access_requests add column if not exists restricted boolean not null default false;
drop policy if exists "Target org can view requests naming them" on records_access_requests;
create policy "Target org can view requests naming them" on records_access_requests for select
  using (restricted = false and target_org_id in (select organization_id from profiles where profiles.id = auth.uid()));
drop policy if exists "Target org can decide on requests" on records_access_requests;
create policy "Target org can decide on requests" on records_access_requests for update
  using (restricted = false and target_org_id in (select organization_id from profiles where profiles.id = auth.uid()));
create policy "Privacy admins can review restricted records requests" on records_access_requests for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- referrals (JCX)
alter table referrals add column if not exists restricted boolean not null default false;
drop policy if exists "Org members can view their org's referrals" on referrals;
create policy "Org members can view their org's referrals" on referrals for select
  using (restricted = false and (from_org_id in (select organization_id from profiles where profiles.id = auth.uid()) or to_org_id in (select organization_id from profiles where profiles.id = auth.uid())));
drop policy if exists "Receiving org can respond to referrals" on referrals;
create policy "Receiving org can respond to referrals" on referrals for update
  using (restricted = false and to_org_id in (select organization_id from profiles where profiles.id = auth.uid()));
create policy "Privacy admins can review restricted referrals" on referrals for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- service_records
alter table service_records add column if not exists restricted boolean not null default false;
drop policy if exists "Providers manage their clients' service records" on service_records;
create policy "Providers manage their clients' service records" on service_records for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()))
  with check (client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Clients can view their own service records" on service_records;
create policy "Clients can view their own service records" on service_records for select
  using (restricted = false and client_id in (select id from clients where auth_user_id = auth.uid()));
create policy "Privacy admins can review restricted service records" on service_records for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));

-- violation_reports
alter table violation_reports add column if not exists restricted boolean not null default false;
drop policy if exists "Providers access own violation_reports" on violation_reports;
create policy "Providers access own violation_reports" on violation_reports for all
  using (restricted = false and client_id in (select id from clients where provider_id = auth.uid()));
drop policy if exists "Providers see own violation_reports" on violation_reports;
create policy "Providers see own violation_reports" on violation_reports for all
  using (restricted = false and (provider_id = auth.uid() or client_id in (select id from clients where provider_id = auth.uid())));
create policy "Privacy admins can review restricted violation reports" on violation_reports for all
  using (restricted = true and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));
