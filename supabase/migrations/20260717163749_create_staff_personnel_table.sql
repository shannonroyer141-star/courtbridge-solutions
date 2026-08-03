CREATE TABLE public.staff_personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.profiles(id),
  organization_id uuid REFERENCES public.organizations(id),
  full_name text NOT NULL,
  role_title text CHECK (role_title = ANY (ARRAY['facilitator'::text, 'assessor'::text, 'trainer'::text, 'admin'::text, 'clinical_supervisor'::text, 'other'::text])),
  employment_status text DEFAULT 'active'::text CHECK (employment_status = ANY (ARRAY['active'::text, 'inactive'::text, 'terminated'::text])),
  hire_date date,
  license_type text CHECK (license_type = ANY (ARRAY['490'::text, '491'::text, '397'::text, 'exempt_3yr_experience'::text, 'none'::text])),
  license_number text,
  license_expiration date,
  dv_training_hours_completed numeric DEFAULT 0,
  dv_training_completed_at date,
  continuing_ed_hours_ytd numeric DEFAULT 0,
  continuing_ed_year integer,
  good_moral_character_signed_at date,
  good_moral_character_expires_at date,
  background_check_date date,
  document_url text,
  status text DEFAULT 'current'::text CHECK (status = ANY (ARRAY['current'::text, 'expiring_soon'::text, 'expired'::text, 'pending_renewal'::text])),
  notes text,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.staff_personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage their own staff records"
  ON public.staff_personnel
  FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());
