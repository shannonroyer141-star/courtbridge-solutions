
create table if not exists court_dates (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  hearing_type text,
  hearing_date date,
  hearing_time time,
  court_name text,
  courtroom text,
  judge_name text,
  attorney_name text,
  attorney_phone text,
  hearing_purpose text,
  outcome text,
  next_hearing_date date,
  documents_required text,
  notes text,
  status text default 'upcoming',
  created_at timestamp default now()
);
