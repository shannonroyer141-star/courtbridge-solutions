<!-- Backup mirror of the live founder_docs.pricing row. The app reads from Supabase, not this file — edit in-app (Founder Docs screen), then re-sync here. Last synced 2026-08-06. -->

# Pricing
DRAFT, model chosen, real numbers not locked yet

2026-08-06 update: Found CourtBridge_Locked_Pricing_Model.docx in Downloads — it's not actually "locked," it's a comparison worksheet between two candidate models, both using the same formula: a flat monthly platform fee + a per-active-client rate. No free tier, no client-count tiers. The doc explicitly ends with "Still to decide: Pick a model — or land somewhere in between," plus two smaller open questions: annual discount? and how does mid-month enrollment bill (prorate vs. full month)?

The two candidate models from that doc:
- ORIGINAL: $59/mo flat + $10.99/client/mo. Example: 10 clients = $168.90/mo.
- REPRICED (the doc argues for this one): $199/mo flat + $22/client/mo. Example: 10 clients = $419/mo. Reasoning in the doc: covers a future HIPAA infrastructure jump (~$900/mo additional) with about half as many paying agencies as the Original model would need, positions CourtBridge as serious compliance tech rather than a bargain app, and still undercuts hardware-based GPS competitors (who run $120–$360/month per participant) by a wide margin even at the higher rate.

The self-serve signup flow (built 2026-07-31) was originally wired around 3 flat tiers (Starter/Growth/Agency) — that structure was WRONG, it matched neither candidate model above. Rebuilt 2026-08-06 around the real flat-fee + per-client formula:
- /signup no longer shows a tier picker — it shows one price (flat + per-client) with a live example at a few client counts.
- Stripe Checkout now creates two line items per subscription: the flat platform fee, and a per-client rate.
- A new background function (sync-client-billing) automatically keeps the per-client line item's quantity matched to the org's real active-client count as clients are added, reactivated, or deactivated — no manual updating needed.
- Currently using the REPRICED numbers ($199/mo + $22/client) as the working placeholder in src/pricing.js and the create-checkout-session/sync-client-billing edge functions, since that's the model the analysis doc favors. These are still not officially locked in — swap the two numbers in src/pricing.js (and the matching numbers in both edge functions) once a real decision is made.
- Mid-month proration is left OFF (a quantity change only affects the next invoice, not the current one) since that's one of the doc's own open questions — revisit once decided.

Still needed before this is truly final:
- Confirm Original vs. Repriced vs. something in between
- Annual discount decision
- Mid-month enrollment proration decision
- Real Stripe keys added to Supabase secrets (checkout exists in code but cannot actually take payment until they're added)
