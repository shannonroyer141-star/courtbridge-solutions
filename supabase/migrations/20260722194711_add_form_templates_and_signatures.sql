create table if not exists form_templates (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  title text not null,
  form_type text not null default 'other',
  content text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists form_signatures (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  form_template_id uuid references form_templates(id) on delete set null,
  form_title text not null,
  form_content_snapshot text not null,
  signature_name text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table form_templates enable row level security;
alter table form_signatures enable row level security;

create policy "Providers manage own form templates" on form_templates for all
  using (provider_id = auth.uid())
  with check (provider_id = auth.uid());

create policy "Clients can view their provider's active form templates" on form_templates for select
  using (
    active = true
    and provider_id in (select provider_id from clients where auth_user_id = auth.uid())
  );

create policy "Providers view own clients' signatures" on form_signatures for select
  using (client_id in (select id from clients where provider_id = auth.uid()));

create policy "Clients view own signatures" on form_signatures for select
  using (client_id in (select id from clients where auth_user_id = auth.uid()));

create policy "Clients can sign forms" on form_signatures for insert
  with check (client_id in (select id from clients where auth_user_id = auth.uid()));