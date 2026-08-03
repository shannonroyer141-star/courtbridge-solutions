create table if not exists founder_tasks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists founder_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists founder_vendor_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_ref text,
  plan_tier text,
  url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table founder_tasks enable row level security;
alter table founder_notes enable row level security;
alter table founder_vendor_accounts enable row level security;

create policy "Founders can view founder tasks" on founder_tasks for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can insert founder tasks" on founder_tasks for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can update founder tasks" on founder_tasks for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can delete founder tasks" on founder_tasks for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));

create policy "Founders can view founder notes" on founder_notes for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can insert founder notes" on founder_notes for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can update founder notes" on founder_notes for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can delete founder notes" on founder_notes for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));

create policy "Founders can view vendor accounts" on founder_vendor_accounts for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can insert vendor accounts" on founder_vendor_accounts for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can update vendor accounts" on founder_vendor_accounts for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));
create policy "Founders can delete vendor accounts" on founder_vendor_accounts for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_founder = true));