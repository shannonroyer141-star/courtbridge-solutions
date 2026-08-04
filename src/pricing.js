// Pricing model: a flat monthly platform fee + a per-active-client rate.
// No tiers, no client caps -- the price scales with usage automatically.
//
// NOT LOCKED IN YET -- these are the "Repriced" numbers from
// CourtBridge_Locked_Pricing_Model.docx (one of two candidate models in that
// doc; Shannon is still reviewing which to use). Change the two numbers below
// once she decides.
//
// IMPORTANT: this file is mirrored in two edge functions (deployed via
// Supabase, not part of this repo's build): create-checkout-session, which
// sets the actual Stripe price at signup, and sync-client-billing, which
// keeps the per-client line item's quantity in sync as clients are added or
// removed. If you change these numbers, update both edge functions too.

export const PRICING = {
  flatMonthlyCents: 19900,      // $199.00/mo flat platform fee -- PLACEHOLDER
  perClientMonthlyCents: 2200,  // $22.00/mo per active client -- PLACEHOLDER
};

export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function estimateMonthly(activeClientCount) {
  const n = Math.max(0, activeClientCount || 0);
  return PRICING.flatMonthlyCents + PRICING.perClientMonthlyCents * n;
}
