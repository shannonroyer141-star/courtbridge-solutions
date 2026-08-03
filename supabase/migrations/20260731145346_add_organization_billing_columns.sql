alter table organizations
  add column if not exists plan text check (plan in ('starter','growth','agency')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text check (subscription_status in ('active','trialing','past_due','canceled')),
  add column if not exists billing_email text;

create unique index if not exists organizations_stripe_customer_id_idx on organizations(stripe_customer_id) where stripe_customer_id is not null;
create unique index if not exists organizations_stripe_subscription_id_idx on organizations(stripe_subscription_id) where stripe_subscription_id is not null;