ALTER TABLE clients ADD COLUMN IF NOT EXISTS enrollment_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auth_user_id uuid;