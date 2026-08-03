-- Org Directory fields
alter table organizations add column if not exists directory_visible boolean not null default false;
alter table organizations add column if not exists specialty_tags text;
alter table organizations add column if not exists capacity_status text check (capacity_status in ('accepting','limited','full'));
alter table organizations add column if not exists directory_description text;
alter table organizations add column if not exists directory_contact_email text;
alter table organizations add column if not exists directory_contact_phone text;

-- Resource Marketplace
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('housing','employment','treatment','legal_aid','food','transportation','other')),
  description text,
  phone text,
  website text,
  address text, city text, state text, zip text,
  added_by_org_id uuid references organizations(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cross-Agency Referrals
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  from_org_id uuid not null references organizations(id),
  to_org_id uuid not null references organizations(id),
  client_id uuid references clients(id),
  client_name text not null,
  client_contact text,
  reason text not null,
  case_summary text,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  responded_by uuid references profiles(id),
  responded_at timestamptz,
  response_note text
);

-- Records Access Requests (safe disclosure model -- request, then explicit approve/deny)
create table if not exists records_access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  requester_org_name text not null,
  requester_email text not null,
  requester_phone text,
  requester_role text,
  client_id uuid references clients(id) not null,
  target_org_id uuid not null references organizations(id),
  reason text not null,
  scope_requested text not null,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz not null default now(),
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  decision_note text
);

alter table resources enable row level security;
alter table referrals enable row level security;
alter table records_access_requests enable row level security;

-- Resources: any authenticated provider can browse active resources; only their own org can manage what they added
create policy "Anyone authenticated can view active resources" on resources for select using (active = true or added_by_org_id = my_org_id_if_admin() or added_by_org_id in (select organization_id from profiles where id = auth.uid()));
create policy "Org members can add resources" on resources for insert with check (added_by_org_id in (select organization_id from profiles where id = auth.uid()));
create policy "Org admins can update their own resources" on resources for update using (added_by_org_id = my_org_id_if_admin());

-- Referrals: visible to sending or receiving org only
create policy "Org members can view their org's referrals" on referrals for select using (
  from_org_id in (select organization_id from profiles where id = auth.uid())
  or to_org_id in (select organization_id from profiles where id = auth.uid())
);
create policy "Org members can create referrals from their org" on referrals for insert with check (
  from_org_id in (select organization_id from profiles where id = auth.uid())
);
create policy "Receiving org can respond to referrals" on referrals for update using (
  to_org_id in (select organization_id from profiles where id = auth.uid())
);

-- Records access requests: public can insert (requesters may not have accounts), only target org can view/decide
create policy "Anyone can submit a records access request" on records_access_requests for insert with check (true);
create policy "Target org can view requests naming them" on records_access_requests for select using (
  target_org_id in (select organization_id from profiles where id = auth.uid())
);
create policy "Target org can decide on requests" on records_access_requests for update using (
  target_org_id in (select organization_id from profiles where id = auth.uid())
);

-- Org directory: any authenticated user can see orgs that opted in
create policy "Directory-visible orgs are viewable by any authenticated user" on organizations for select using (
  directory_visible = true or id in (select organization_id from profiles where id = auth.uid())
);
create policy "Org admins can update their own organization" on organizations for update using (
  id = my_org_id_if_admin()
);