-- BIP staff credentialing fields, matching the DCF BIP Personnel File Review Checklist
-- (BIP Monitoring Review Tools, "Employee File Review" tab) and Rule 65H-2.016(2),
-- 65H-2.016(9)(b), 65H-2.018, and 65H-2.019, F.A.C.

alter table staff_personnel add column if not exists separation_date date;
alter table staff_personnel add column if not exists terminated_for_disqualifying_offense boolean not null default false;
-- 65H-2.016(2)(e): notify ODV within 24 hours of terminating staff for a disqualifying offense.
alter table staff_personnel add column if not exists odv_termination_notified_at timestamptz;

-- Checklist items a-f, h, l-n (65H-2.016(9)(b)).
alter table staff_personnel add column if not exists address_on_file boolean not null default false;
alter table staff_personnel add column if not exists home_phone_on_file boolean not null default false;
alter table staff_personnel add column if not exists date_of_birth_on_file boolean not null default false;
alter table staff_personnel add column if not exists photo_id_on_file boolean not null default false;
alter table staff_personnel add column if not exists resume_or_application_on_file boolean not null default false;
alter table staff_personnel add column if not exists employment_history_check_date date;
alter table staff_personnel add column if not exists job_description_on_file boolean not null default false;
alter table staff_personnel add column if not exists policy_manual_receipt_date date;
-- Only for staff licensed under Ch. 490/491, F.S.
alter table staff_personnel add column if not exists confidentiality_statement_signed boolean not null default false;

-- Item g: facilitator credential basis (65H-2.018(1)(a)): bachelor's degree, or 2 years'
-- experience working with DV victims and batterers. DCF's list also has "Exempt".
alter table staff_personnel add column if not exists credential_basis text
  check (credential_basis is null or credential_basis in ('degree', 'experience', 'exempt'));
-- Assessor (65H-2.019(1)(a)): 2 years supervised psychosocial assessment clinical experience.
alter table staff_personnel add column if not exists assessor_supervised_experience_years numeric;

-- Item j: initial affidavit of good moral character, and whether it was notarized.
alter table staff_personnel add column if not exists good_moral_character_notarized boolean not null default false;

-- Items o-p (65H-2.018(1)(c)-(e)): new facilitators.
alter table staff_personnel add column if not exists facilitator_training_hours numeric not null default 0;       -- 21 required
alter table staff_personnel add column if not exists supervised_facilitation_hours numeric not null default 0;    -- 72 required
alter table staff_personnel add column if not exists odv_training_approved_at date;                              -- before facilitating alone
