alter table records_access_requests alter column client_id drop not null;
alter table records_access_requests add column if not exists client_name_text text;