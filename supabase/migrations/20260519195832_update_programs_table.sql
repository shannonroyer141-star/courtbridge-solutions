
ALTER TABLE public."Programs"
  ADD COLUMN address text,
  ADD COLUMN provider_id bigint REFERENCES public."Providers"(id);
