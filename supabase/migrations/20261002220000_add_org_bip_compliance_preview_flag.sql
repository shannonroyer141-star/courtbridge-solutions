-- Lets a specific organization see the BIP Compliance screens pre-launch,
-- without opening the founder-only preview to every provider.
alter table public.organizations
  add column if not exists bip_compliance_enabled boolean not null default false;
