alter table clients add column if not exists address text;
alter table clients add column if not exists status_changed_at timestamptz;