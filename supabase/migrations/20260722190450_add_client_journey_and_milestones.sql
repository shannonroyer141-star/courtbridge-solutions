create table if not exists client_programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  order_name text not null,
  order_type text not null default 'primary' check (order_type in ('primary', 'accompanying')),
  start_date date not null default current_date,
  duration_weeks integer,
  status text not null default 'active' check (status in ('active', 'completed', 'terminated')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists client_milestones (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  milestone_type text not null,
  title text not null,
  description text,
  achieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table client_programs enable row level security;
alter table client_milestones enable row level security;

create policy "Providers and clients can view programs" on client_programs for select
  using (
    client_id in (select id from clients where provider_id = auth.uid())
    or client_id in (select id from clients where auth_user_id = auth.uid())
  );
create policy "Providers manage programs" on client_programs for insert
  with check (client_id in (select id from clients where provider_id = auth.uid()));
create policy "Providers update programs" on client_programs for update
  using (client_id in (select id from clients where provider_id = auth.uid()));
create policy "Providers delete programs" on client_programs for delete
  using (client_id in (select id from clients where provider_id = auth.uid()));

create policy "Providers and clients can view milestones" on client_milestones for select
  using (
    client_id in (select id from clients where provider_id = auth.uid())
    or client_id in (select id from clients where auth_user_id = auth.uid())
  );
create policy "Providers and clients can insert milestones" on client_milestones for insert
  with check (
    client_id in (select id from clients where provider_id = auth.uid())
    or client_id in (select id from clients where auth_user_id = auth.uid())
  );
create policy "Providers update milestones" on client_milestones for update
  using (client_id in (select id from clients where provider_id = auth.uid()));
create policy "Providers delete milestones" on client_milestones for delete
  using (client_id in (select id from clients where provider_id = auth.uid()));