
ALTER TABLE public.meeting_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cps_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completion_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Providers can only see their own clients' data
CREATE POLICY "Providers see own meeting_log" ON public.meeting_log
  FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

CREATE POLICY "Providers see own po_visits" ON public.po_visits
  FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

CREATE POLICY "Providers see own cps_cases" ON public.cps_cases
  FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

CREATE POLICY "Providers see own court_dates" ON public.court_dates
  FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

CREATE POLICY "Users see own affirmations" ON public.affirmations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Providers see own organization" ON public.organizations
  FOR ALL USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Providers see own locations" ON public.locations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users see own policy acknowledgments" ON public.policy_acknowledgments
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Providers see own messages" ON public.messages
  FOR ALL USING (provider_id = auth.uid() OR client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

CREATE POLICY "Providers see own violation_reports" ON public.violation_reports
  FOR ALL USING (provider_id = auth.uid() OR client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

CREATE POLICY "Providers see own completion_certificates" ON public.completion_certificates
  FOR ALL USING (provider_id = auth.uid() OR client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

CREATE POLICY "Providers see own sms_logs" ON public.sms_logs
  FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
