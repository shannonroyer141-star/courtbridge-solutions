
alter table profiles add column if not exists checkin_frequency_hours int default 24;
alter table profiles add column if not exists alert_email text;
alter table profiles add column if not exists organization_name text;
alter table profiles add column if not exists contact_name text;
alter table profiles add column if not exists address text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists state text default 'FL';
alter table profiles add column if not exists zip text;
alter table profiles add column if not exists program_types text;
alter table profiles add column if not exists license_number text;
alter table profiles add column if not exists website text;
alter table profiles add column if not exists onboarding_complete boolean default false;
alter table profiles add column if not exists intake_complete boolean default false;
alter table profiles add column if not exists organization_id uuid;
alter table profiles add column if not exists is_org_admin boolean default false;
alter table profiles add column if not exists org_role text default 'provider';
alter table profiles add column if not exists account_status text default 'active';
alter table profiles add column if not exists phone text;
