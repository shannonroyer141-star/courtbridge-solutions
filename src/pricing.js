// Plan tiers for self-serve signup. Prices are PLACEHOLDERS -- Shannon has not
// finalized real numbers yet (see Founder Docs > Pricing). Edit priceMonthly
// (in cents) here before going live with real Stripe keys.
//
// IMPORTANT: this file is mirrored in the create-checkout-session edge function
// (supabase/functions/create-checkout-session, deployed via Supabase, not part
// of this repo's build). If you change prices/tiers here, update that function
// too -- the edge function is the authoritative source Stripe actually charges,
// this file is just what the signup page displays.

export const PLAN_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 9900, // $99.00/mo -- PLACEHOLDER
    maxClients: 25,
    tagline: 'For a small caseload getting started',
    features: [
      'Up to 25 active clients',
      'Check-ins, alerts, messaging',
      'Compliance reports',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    priceMonthly: 24900, // $249.00/mo -- PLACEHOLDER
    maxClients: 100,
    tagline: 'For a growing agency',
    popular: true,
    features: [
      'Up to 100 active clients',
      'Everything in Starter',
      'Urgent SMS alerts at volume',
      'Compliance chart, document storage',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    priceMonthly: 49900, // $499.00/mo -- PLACEHOLDER
    maxClients: null,
    tagline: 'For larger, multi-program agencies',
    features: [
      'Unlimited active clients',
      'Everything in Growth',
      'Priority support',
    ],
  },
];

export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(0)}`;
}
