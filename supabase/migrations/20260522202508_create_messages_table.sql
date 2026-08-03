
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id),
  provider_id uuid references auth.users(id),
  to_email text not null,
  to_name text,
  subject text not null,
  body text not null,
  sent_at timestamp default now(),
  delivered boolean default false,
  delivery_error text,
  message_type text default 'general',
  created_at timestamp default now()
);

create index if not exists messages_client_id_idx on messages(client_id);
create index if not exists messages_provider_id_idx on messages(provider_id);
