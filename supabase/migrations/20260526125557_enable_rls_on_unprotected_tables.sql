
-- Enable RLS
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

-- Providers can see their own data
CREATE POLICY "Providers access own meeting_log" ON public.meeting_log FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
CREATE POLICY "Providers access own po_visits" ON public.po_visits FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
CREATE POLICY "Providers access own cps_cases" ON public.cps_cases FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
CREATE POLICY "Providers access own court_dates" ON public.court_dates FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
CREATE POLICY "Providers access own violation_reports" ON public.violation_reports FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
CREATE POLICY "Providers access own completion_certificates" ON public.completion_certificates FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
CREATE POLICY "Providers access own messages" ON public.messages FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));
CREATE POLICY "Providers access own sms_logs" ON public.sms_logs FOR ALL USING (client_id IN (SELECT id FROM public.clients WHERE provider_id = auth.uid()));

-- Users access their own records
CREATE POLICY "Users access own affirmations" ON public.affirmations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users access own policy_acknowledgments" ON public.policy_acknowledgments FOR ALL USING (user_id = auth.uid());

-- Organizations and locations visible to authenticated users
CREATE POLICY "Authenticated users view organizations" ON public.organizations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users view locations" ON public.locations FOR SELECT USING (auth.role() = 'authenticated');
