-- Follow-up security hardening, found during a 2026-09-16 platform review.
--
-- 1) The 2026-09-08 audit log migration missed the same hardening already
--    applied to prevent_self_privilege_escalation() on 2026-08-10:
--    block_audit_log_tampering() had no pinned search_path, and
--    log_audit_event()'s revoke only targeted the `public` pseudo-role, not
--    Supabase's separate default EXECUTE grants to anon/authenticated.
--    Both are RETURNS TRIGGER functions Postgres refuses to invoke outside
--    trigger context regardless of grants, so real exploitability was low,
--    but this closes the gap properly and matches the established pattern.
--
-- 2) The JCX resources table's policies were never scoped `to authenticated`
--    despite their own names/comments saying that was the intent ("Anyone
--    authenticated can view active resources"). With no TO clause, Postgres
--    defaults to PUBLIC, so unauthenticated requests to the anon REST API
--    could read every active resource listing (title, phone, address,
--    website) in the marketplace. The insert/update policies were not
--    practically exploitable the same way (their USING/WITH CHECK clauses
--    depend on auth.uid(), which is null for anon), but are scoped here too
--    for consistency with stated intent.

create or replace function public.block_audit_log_tampering()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'audit_log entries cannot be modified or deleted -- this table is append-only by design';
end;
$$;

revoke execute on function public.log_audit_event() from public, anon, authenticated;

alter policy "Anyone authenticated can view active resources" on resources to authenticated;
alter policy "Org members can add resources" on resources to authenticated;
alter policy "Org admins can update their own resources" on resources to authenticated;
