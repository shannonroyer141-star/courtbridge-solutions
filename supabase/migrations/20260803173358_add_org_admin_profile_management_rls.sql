create or replace function my_org_id_if_admin()
returns uuid
language sql security definer stable
as $$
  select organization_id from profiles where id = auth.uid() and (is_org_admin = true or is_founder = true)
$$;

create policy "Org admins can view org members"
on profiles for select
using (
  organization_id is not null and organization_id = my_org_id_if_admin()
);

create policy "Org admins can update org members"
on profiles for update
using (
  organization_id is not null and organization_id = my_org_id_if_admin()
)
with check (
  organization_id is not null and organization_id = my_org_id_if_admin()
);