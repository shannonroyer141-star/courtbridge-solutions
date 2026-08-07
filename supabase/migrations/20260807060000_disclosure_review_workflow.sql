-- Structured disclosure review for records_access_requests: the platform never interprets
-- or auto-approves a request -- it forces a human to answer each legal question before
-- approval is even possible, and records who made that call.
alter table records_access_requests add column if not exists consent_obtained boolean;
alter table records_access_requests add column if not exists consent_details text;
alter table records_access_requests add column if not exists legal_authority_type text
  check (legal_authority_type is null or legal_authority_type in ('court_order', 'subpoena', 'statute', 'participant_consent_only', 'other', 'none'));
alter table records_access_requests add column if not exists legal_authority_details text;
alter table records_access_requests add column if not exists part2_applies boolean;
alter table records_access_requests add column if not exists minimum_necessary_description text;
alter table records_access_requests add column if not exists approver_attestation boolean not null default false;

-- Can't reach 'approved' status without every review question actually answered.
alter table records_access_requests drop constraint if exists approval_requires_review;
alter table records_access_requests add constraint approval_requires_review check (
  status != 'approved' or (
    consent_obtained is not null and
    legal_authority_type is not null and
    part2_applies is not null and
    minimum_necessary_description is not null and
    approver_attestation = true
  )
);

-- Approving/denying a disclosure is a privacy-officer-level decision, not routine staff work.
drop policy if exists "Target org can decide on requests" on records_access_requests;
create policy "Org admins can decide on requests" on records_access_requests for update
  using (restricted = false and target_org_id in (select organization_id from profiles where profiles.id = auth.uid())
    and exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));
