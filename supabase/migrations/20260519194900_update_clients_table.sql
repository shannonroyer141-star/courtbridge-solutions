
-- Add new columns
ALTER TABLE public."Clients"
  ADD COLUMN phone text,
  ADD COLUMN case_number text,
  ADD COLUMN program_type program_type_enum,
  ADD COLUMN start_date date,
  ADD COLUMN completion_date date,
  ADD COLUMN provider_id bigint REFERENCES public."Providers"(id);

-- Remove provider_email since we now link by provider_id
ALTER TABLE public."Clients"
  DROP COLUMN provider_email;
