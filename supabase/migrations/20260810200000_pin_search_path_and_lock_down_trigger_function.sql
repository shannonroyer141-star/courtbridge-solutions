-- Pin search_path on SECURITY DEFINER functions flagged by the Supabase linter
-- (closes a schema-injection risk), and stop exposing the self-privilege-escalation
-- trigger function as a callable RPC endpoint -- it's trigger-only, no client role
-- needs to call it directly.

alter function public.my_org_id_if_admin() set search_path = public, pg_temp;
alter function public.prevent_self_privilege_escalation() set search_path = public, pg_temp;
revoke execute on function public.prevent_self_privilege_escalation() from public, anon, authenticated;
