-- GPS protection: record every person who views or exports exact coordinates.
create table if not exists location_access_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  action text not null check (action in ('viewed_map', 'exported_report', 'viewed_coordinate_link')),
  client_id uuid references clients(id) on delete set null,
  checkin_count integer,
  created_at timestamptz not null default now()
);

alter table location_access_log enable row level security;

create policy "Users can log their own location access" on location_access_log for insert
  with check (user_id = auth.uid());

create policy "Privacy admins can view location access log" on location_access_log for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and (profiles.is_org_admin = true or profiles.is_founder = true)));
