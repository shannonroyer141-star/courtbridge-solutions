
create table if not exists po_visits (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  visit_date date,
  visit_time time,
  visit_type text default 'In-Person',
  po_name text,
  po_phone text,
  po_agency text,
  location text,
  outcome text,
  next_visit_date date,
  notes text,
  status text default 'completed',
  created_at timestamp default now()
);
