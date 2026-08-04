-- "Users can update their own profile" (auth.uid() = id) has no column
-- restriction, so any authenticated user -- including one who was just
-- deactivated or demoted -- can PATCH their own account_status,
-- is_org_admin, org_role, is_founder, organization_id, or role directly
-- via the API and reverse it. This trigger blocks that specific
-- self-escalation path while leaving every other self-service field
-- (name, phone, quiet hours, preferred_language, etc.) untouched, and
-- leaving existing admins/founders able to edit their own row exactly as
-- they can today (org-admin-on-teammate updates are unaffected -- they
-- go through a different RLS policy keyed on the target row, not this
-- trigger, which only fires when auth.uid() = OLD.id).

create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() = OLD.id
     and not coalesce(OLD.is_org_admin, false)
     and not coalesce(OLD.is_founder, false)
  then
    if NEW.account_status is distinct from OLD.account_status
       or NEW.is_org_admin is distinct from OLD.is_org_admin
       or NEW.org_role is distinct from OLD.org_role
       or NEW.is_founder is distinct from OLD.is_founder
       or NEW.organization_id is distinct from OLD.organization_id
       or NEW.role is distinct from OLD.role
    then
      raise exception 'You do not have permission to change this on your own account. Ask an org admin.';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists prevent_self_privilege_escalation_trigger on public.profiles;

create trigger prevent_self_privilege_escalation_trigger
before update on public.profiles
for each row
execute function public.prevent_self_privilege_escalation();
