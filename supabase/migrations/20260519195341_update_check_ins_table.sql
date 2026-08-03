
-- Create check_in_status enum
CREATE TYPE check_in_status_enum AS ENUM (
  'Present',
  'Late',
  'Missed'
);

-- Remove redundant columns
ALTER TABLE public."Check_ins"
  DROP COLUMN client_email,
  DROP COLUMN program_name,
  DROP COLUMN program_latitude,
  DROP COLUMN program_longitude;

-- Add new columns
ALTER TABLE public."Check_ins"
  ADD COLUMN check_in_status check_in_status_enum,
  ADD COLUMN notes text;
