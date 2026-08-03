
alter table public.messages
  add column if not exists sender_role text not null default 'provider' check (sender_role in ('provider','client')),
  add column if not exists is_urgent boolean not null default false;

create policy "Clients can view their own messages"
  on public.messages for select
  using (
    client_id in (select id from public.clients where auth_user_id = auth.uid())
  );

create policy "Clients can send their own messages"
  on public.messages for insert
  with check (
    sender_role = 'client'
    and client_id in (select id from public.clients where auth_user_id = auth.uid())
  );
