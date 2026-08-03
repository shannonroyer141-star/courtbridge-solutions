
create table if not exists cps_cases (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  case_number text,
  agency text default 'DCF',
  case_type text,
  case_worker_name text,
  case_worker_phone text,
  case_worker_email text,
  open_date date,
  next_hearing_date date,
  children_involved text,
  reunification_goal boolean default true,
  safety_plan boolean default false,
  out_of_home boolean default false,
  notes text,
  status text default 'active',
  created_at timestamp default now()
);
