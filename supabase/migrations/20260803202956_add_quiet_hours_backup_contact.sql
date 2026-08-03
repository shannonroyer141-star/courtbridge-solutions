alter table profiles add column if not exists quiet_hours_enabled boolean not null default false;
alter table profiles add column if not exists quiet_hours_start text; -- 'HH:MM' 24hr
alter table profiles add column if not exists quiet_hours_end text;   -- 'HH:MM' 24hr
alter table profiles add column if not exists backup_contact_name text;
alter table profiles add column if not exists backup_contact_phone text;