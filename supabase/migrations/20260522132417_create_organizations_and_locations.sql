
create table if not exists organizations (
  id uuid default gen_random_uuid() primary key,
  organization_name text not null,
  address text,
  city text,
  state text default 'FL',
  zip text,
  phone text,
  website text,
  license_number text,
  approved_latitude float,
  approved_longitude float,
  allowed_radius_miles float default 0.25,
  created_at timestamp default now()
);

create table if not exists locations (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id),
  location_name text,
  address text,
  city text,
  state text default 'FL',
  zip text,
  approved_latitude float,
  approved_longitude float,
  allowed_radius_miles float default 0.25,
  created_at timestamp default now()
);
