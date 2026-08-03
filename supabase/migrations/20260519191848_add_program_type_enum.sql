
CREATE TYPE program_type_enum AS ENUM (
  'BIP',
  'DUI',
  'Drug Court',
  'Mental Health Court',
  'Veterans Court',
  'Specialty Court'
);

ALTER TABLE public."Providers"
  ALTER COLUMN program_type TYPE program_type_enum
  USING program_type::program_type_enum;
