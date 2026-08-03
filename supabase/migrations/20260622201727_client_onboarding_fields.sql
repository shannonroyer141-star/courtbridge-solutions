
-- Add onboarding fields to invites table
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS case_number text,
  ADD COLUMN IF NOT EXISTS enrollment_type text DEFAULT 'court_ordered' CHECK (enrollment_type = ANY (ARRAY['court_ordered','probation_referred','voluntary','no_document'])),
  ADD COLUMN IF NOT EXISTS reporting_requirements text,
  ADD COLUMN IF NOT EXISTS checkin_schedule text,
  ADD COLUMN IF NOT EXISTS program_phase text DEFAULT 'Phase 1',
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS gps_consent_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);

-- Add onboarding_complete field to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS case_number text,
  ADD COLUMN IF NOT EXISTS enrollment_type text DEFAULT 'court_ordered',
  ADD COLUMN IF NOT EXISTS reporting_requirements text,
  ADD COLUMN IF NOT EXISTS checkin_schedule text,
  ADD COLUMN IF NOT EXISTS program_phase text DEFAULT 'Phase 1',
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS gps_consent_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status = ANY (ARRAY['active','inactive','graduated','terminated']));
