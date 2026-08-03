
create table if not exists affirmations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  affirmation text not null,
  role text default 'provider',
  is_reflection boolean default false,
  reflection_date timestamp,
  created_at timestamp default now()
);
