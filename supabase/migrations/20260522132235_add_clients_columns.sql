
alter table "Clients" add column if not exists dob date;
alter table "Clients" add column if not exists case_number text;
alter table "Clients" add column if not exists program_type text;
alter table "Clients" add column if not exists probation_officer text;
alter table "Clients" add column if not exists emergency_contact text;
alter table "Clients" add column if not exists intake_complete boolean default false;
alter table "Clients" add column if not exists high_risk boolean default false;
alter table "Clients" add column if not exists user_id uuid references auth.users(id);
alter table "Clients" add column if not exists status text default 'active';
alter table "Clients" add column if not exists status_date timestamp;
alter table "Clients" add column if not exists status_notes text;
alter table "Clients" add column if not exists organization_id uuid;
alter table "Clients" add column if not exists location_id uuid;
