-- Bug fix: clients.check_in_frequency_days was referenced by Alerts.jsx, ComplianceChart.jsx,
-- ProviderDashboard.jsx, and written by Clients.jsx, but the column was never actually added
-- to the database -- breaking Missed Check-In Alerts in production ("column
-- clients.check_in_frequency_days does not exist").

alter table public.clients
  add column if not exists check_in_frequency_days integer not null default 1;
