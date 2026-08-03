
create table if not exists policy_acknowledgments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  policy_type text,
  acknowledged boolean default false,
  acknowledged_at timestamp,
  created_at timestamp default now()
);
