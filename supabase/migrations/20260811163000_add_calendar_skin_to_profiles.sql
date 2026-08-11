alter table public.profiles
  add column if not exists calendar_skin text not null default 'navy';
