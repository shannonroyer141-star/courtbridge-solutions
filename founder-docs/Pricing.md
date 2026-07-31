<!-- Backup mirror of the live founder_docs.pricing row. The app reads from Supabase, not this file — edit in-app (Founder Docs screen), then re-sync here. Last synced 2026-07-30. -->

# Pricing
DRAFT, nothing final yet

Decided 2026-07-22: providers will sign up and pay through the website eventually, but self-service signup + payment is on hold until pricing is actually settled. For now, new agencies reach out by phone/email (see the marketing site) and get set up manually.

Rough direction discussed: tiered packages, likely based on active client count rather than a flat seat price, since client volume is what actually drives Twilio/Resend/hosting cost. Draft tier shape (names and numbers all placeholder):

- STARTER — small caseload (e.g. up to 25 active clients). Core features: check-ins, alerts, messaging, reports.
- GROWTH — mid-size (e.g. up to 100 active clients). Adds SMS urgent alerts at volume, compliance chart, document storage.
- AGENCY — unlimited clients. Priority support, possible white-label/branding later.

Still needed before this can go anywhere:
- Actual price per tier
- Client-count cutoffs per tier
- Whether self-service fully replaces manual signup or runs alongside it for negotiated deals
- Stripe integration (no upfront cost, just a per-transaction cut, so this isn't the blocker — pricing is)

---
2026-07-31 update: Self-serve signup + Stripe payment is now BUILT (a new /signup page, Stripe Checkout, and an automatic webhook that creates the org and emails the admin an invite). The three tiers/prices above are still placeholder numbers hardcoded in src/pricing.js -- decide real numbers, then update that file (and the matching numbers in the create-checkout-session edge function) before adding real Stripe keys. Until Stripe keys are added to Supabase secrets, /signup exists but checkout will not actually work.
