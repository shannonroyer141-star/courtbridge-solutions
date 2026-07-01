// src/demo/mockData.js
// Hardcoded demo data — DEMO_MODE only, never touches Supabase

export const DEMO_PROVIDER_TEMPLATE = {
  id: 'demo-provider-001',
  name: '', // filled in from sandbox signup form
  email: '',
  organization: 'Demo Recovery Partners',
  role: 'provider',
};

export const DEMO_CLIENT = {
  id: 'demo-client-marcus',
  auth_user_id: '344a27fc-8080-4390-9afe-aa6153f7664e',
  name: 'Marcus T. Williams',
  email: 'marcus.demo@courtbridge.io',
  population_type: 'drug_court',
  provider_id: 'demo-provider-001',
  enrollment_date: null, // set when onboarding completes
  status: 'pending', // pending -> active after onboarding
};

// Pre-seeded check-in history shown immediately after onboarding completes
// so the dashboard doesn't look empty on first view
export const SEEDED_CHECKINS = [
  { day_offset: -6, status: 'completed', time: '8:42 AM' },
  { day_offset: -5, status: 'completed', time: '9:15 AM' },
  { day_offset: -4, status: 'completed', time: '8:30 AM' },
  { day_offset: -3, status: 'missed', time: null },
  { day_offset: -2, status: 'completed', time: '8:55 AM' },
  { day_offset: -1, status: 'completed', time: '9:02 AM' },
  // today's check-in is done live by the user in the demo
];

export const DEMO_COMPLIANCE_SUMMARY = {
  total_days: 7,
  completed: 6,
  missed: 1,
  compliance_rate: 86,
  period_label: 'Last 30 Days',
};
