
alter table legal_agreements add column if not exists signer_name text;
alter table programs add column if not exists program_name text;
alter table programs add column if not exists program_type text;
alter table programs add column if not exists duration_weeks int;
alter table programs add column if not exists frequency text;
alter table programs add column if not exists approved_latitude float;
alter table programs add column if not exists approved_longitude float;
alter table programs add column if not exists allowed_radius_miles float default 0.25;
alter table calendar_events add column if not exists event_date timestamp;
alter table calendar_events add column if not exists client_name text;
alter table calendar_events add column if not exists notes text;
alter table contact_log add column if not exists direction text;
alter table contact_log add column if not exists summary text;
alter table tasks add column if not exists assigned_to text;
alter table tasks add column if not exists priority text default 'Medium';
alter table tasks add column if not exists notes text;
