-- Held back from the private (founder-only) BIP preview: this changes behavior for every
-- provider (BIP clients become undeletable until 5 years after discharge), so it is applied
-- at the public BIP launch. Relies on bip_discharges from 20260928130000.

-- 5-year retention: (9)(c) participant files are kept at least five years from discharge.
-- A BIP participant (and their attendance records) can't be deleted until 5 years after
-- their most recent discharge; one with no discharge on record can't be deleted at all.
create or replace function public.bip_retention_ends(p_client_id uuid)
returns timestamptz
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select max(discharge_at) + interval '5 years' from bip_discharges where client_id = p_client_id;
$$;
revoke all on function public.bip_retention_ends(uuid) from public, anon;
grant execute on function public.bip_retention_ends(uuid) to authenticated;

create or replace function public.block_bip_record_deletion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Read through jsonb: plpgsql errors on OLD.client_id when the row (clients) has no such column.
  v_client uuid := case when TG_TABLE_NAME = 'clients' then OLD.id else (to_jsonb(OLD)->>'client_id')::uuid end;
  v_until timestamptz;
begin
  if not exists (select 1 from clients where id = v_client and population_type = 'bip') then
    return OLD;
  end if;
  v_until := bip_retention_ends(v_client);
  if v_until is null or v_until > now() then
    raise exception 'BIP participant records must be kept at least 5 years from discharge (Rule 65H-2.016(9)(c)). %',
      case when v_until is null then 'No discharge is on record for this participant.' else 'Earliest deletion date: ' || to_char(v_until at time zone 'America/New_York', 'Mon DD, YYYY') end;
  end if;
  return OLD;
end;
$$;
revoke all on function public.block_bip_record_deletion() from public, anon, authenticated;

create trigger clients_bip_retention before delete on clients for each row execute function block_bip_record_deletion();
create trigger service_records_bip_retention before delete on service_records for each row execute function block_bip_record_deletion();
