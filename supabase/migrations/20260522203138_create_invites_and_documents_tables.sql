
-- Client invites table (already exists but let's add missing columns)
alter table invites add column if not exists program_type text;
alter table invites add column if not exists message text;
alter table invites add column if not exists accepted_at timestamp;

-- Documents table for file uploads
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  provider_id uuid references auth.users(id),
  file_name text not null,
  file_url text,
  file_size int,
  file_type text,
  document_type text,
  notes text,
  uploaded_at timestamp default now(),
  created_at timestamp default now()
);

-- Violation reports table
create table if not exists violation_reports (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  provider_id uuid references auth.users(id),
  report_date date default current_date,
  violation_type text,
  description text,
  missed_checkins int default 0,
  last_checkin date,
  drug_test_failures int default 0,
  missed_po_visits int default 0,
  missed_court_dates int default 0,
  recommended_action text,
  submitted_to text,
  submitted_at timestamp,
  status text default 'draft',
  created_at timestamp default now()
);

-- Completion certificates table
create table if not exists completion_certificates (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  provider_id uuid references auth.users(id),
  program_name text,
  completion_date date,
  total_sessions int,
  total_checkins int,
  certificate_number text,
  issued_at timestamp default now(),
  created_at timestamp default now()
);

-- SMS logs table
create table if not exists sms_logs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  phone_number text,
  message text,
  direction text default 'outbound',
  status text,
  sent_at timestamp default now(),
  created_at timestamp default now()
);
