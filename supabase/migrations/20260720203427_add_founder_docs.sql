
alter table public.profiles
  add column if not exists is_founder boolean not null default false;

update public.profiles set is_founder = true where email = 'shannonroyer141@gmail.com';

create table if not exists public.founder_docs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  updated_at timestamp without time zone not null default now()
);

alter table public.founder_docs enable row level security;

create policy "Founders can view founder docs"
  on public.founder_docs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_founder = true));

create policy "Founders can update founder docs"
  on public.founder_docs for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_founder = true));

insert into public.founder_docs (slug, title, content) values
  ('sop', 'Standard Operating Procedures', '_Draft space for your internal SOPs. Nothing written yet — this is a placeholder until real procedures are added._'),
  ('policies', 'Policies', '_Draft space for organizational policies. Nothing written yet._'),
  ('noncompete', 'Non-Compete', '_Draft space for non-compete terms. Have an attorney review before this becomes real, binding text._'),
  ('legal', 'Legal', '_Draft space for terms of service, privacy policy, and other legal text. Have an attorney review before this becomes real, binding text._')
on conflict (slug) do nothing;
