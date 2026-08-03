create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id),
  provider_id uuid references public.profiles(id),
  title text,
  content text not null,
  entry_date date,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

alter table public.clinical_notes enable row level security;

create policy "Providers can manage clinical notes"
  on public.clinical_notes for all
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);
