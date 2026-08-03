
create table if not exists meeting_log (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  meeting_type text,
  meeting_date date,
  meeting_time time,
  location_name text,
  address text,
  verification_method text default 'gps',
  secretary_name text,
  secretary_phone text,
  notes text,
  verified boolean default false,
  verified_by uuid references auth.users(id),
  verified_at timestamp,
  created_at timestamp default now()
);
