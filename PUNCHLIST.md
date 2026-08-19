# CourtBridge Punch List

_Last updated: 2026-08-10, after a lint/security cleanup pass and the Platform Activity preview build._

## ✅ Done & working
Dashboard, Clients, Check-Ins, Map View, Alerts, Reports, Drug Tests, Tasks, Court Dates, Calendar, Affirmations (Wellness), Settings (My Preferences), Contact Log, PO Visits, CPS Tracking, Compliance Chart, Meeting Log, Client Profile, Messages (two-way + urgent SMS alert to provider's phone, with failure feedback), Client Invites (pending-count badge), Violation Reports, Founder Docs (founder-only), Org Settings (editable IT contact), client-side portal (onboarding, check-in, messaging), Client Intake + Send Enrollment Link (shared logic), Completion Certificates (redesigned 8/7 — 8 landscape templates, org-name bug fixed), SMS Alerts, Case/Clinical Notes, Staff Credentialing, Compliance Requirements, Funding Sources, Audit Readiness (self-scored checklist, not a system audit trail), Programs, Assessments (Phase 2 reference-only, no data entry), User & Role Management, Justice Collaboration Exchange (directory/marketplace/referrals/records requests), self-serve signup + Stripe, offline check-in queuing, Spanish + Haitian Creole translations on the client dashboard, per-client check-in frequency, quiet hours + backup contact for alerts, victim info flagging/restriction, GPS/location access logging, disclosure review workflow, real SOP content.

## 🆕 New 2026-08-10: Platform Activity (founder-only preview)
Added a "Platform Activity" screen under Founder nav (`PlatformActivity.jsx`) showing cross-organization signal: all orgs with client counts/plan/status, urgent client messages, SMS failures, and check-ins from the last 48h — across **every** org, not just the founder's own.

This required new Supabase RLS policies (`Founder preview: view all ...` on organizations/clients/checkins/messages/sms_logs/profiles) since founder access was previously scoped to their own org just like a regular org admin — there was no cross-tenant visibility at all before today. **Shannon explicitly chose full cross-org visibility** (vs. aggregated-stats-only or org-scoped) after being told this breaks per-org data isolation between provider customers. Framed as a preview to see what it looks like before deciding if it stays permanently.
**Easy to revert**: drop the 6 "Founder preview: ..." policies (migration `founder_cross_org_activity_preview` + `founder_cross_org_activity_preview_profiles`) and nothing else is affected.

## 🔒 Security cleanup done 2026-08-10
- Fixed `nanoid` high-severity vuln (Dependabot) via `npm audit fix` — lockfile only, no code change.
- Pinned `search_path` on two `SECURITY DEFINER` functions (`my_org_id_if_admin`, `prevent_self_privilege_escalation`) — closes a schema-injection risk.
- Revoked RPC exposure on `prevent_self_privilege_escalation` (the trigger that blocks self-privilege-escalation on `profiles`) — it's trigger-only, never needed to be callable directly by anon/authenticated.
- **Left intentionally**: `my_org_id_if_admin` still executable by `anon`/`authenticated` — required by RLS policies on `profiles`/`resources`/`organizations` that are scoped `TO public`, not `TO authenticated`. Revoking breaks real anon-facing queries.
- **Open question, not yet decided**: the RLS policy `"Anyone authenticated can view active resources"` on the `resources` table is actually scoped `TO public` (unauthenticated visitors included), despite its name. Might be intentional (public browsing pre-signup) or might be a gap — needs Shannon's call.

## 🧹 Lint cleanup done 2026-08-10
Went from 87 errors/18 warnings down to 19 errors/18 warnings. Fixed: ~15 unused imports/vars, a duplicate `color` style key in `StaffCredentialing.jsx` (3 headers, second value was silently winning), function-declared-after-use ordering in ~10 data-fetching effects, hoisted `App.jsx`'s sidebar `Ic` icon component out of render.
**Left intentionally**: 19 `set-state-in-effect` + 17 `exhaustive-deps` warnings are all the standard "reset loading state, then fetch on mount" pattern already working correctly in prod — rewriting the data-fetch architecture across ~17 files with no test suite is a bad risk/reward trade for a stylistic gain from a newer, stricter lint rule. `DemoContext.jsx`'s fast-refresh warning is dev-only, zero production impact.

## 🎨 Next up: redesign Completion Certificates
~~Shannon flagged 7/28 that the certificate designs weren't good~~ — **done 8/7**, 8 new landscape templates.

## 🧹 Still open
- **SOP**: real content now drafted (8/10) — still needs Shannon's review/sign-off.
- The `resources` table RLS scoping question above.

## 📋 "Workflow Studio" — partially resolved
- ~~User & Role Management UI~~ — **done**, built 8/10-ish (screen exists, account deactivation works).
- ~~Org-wide escalation rules~~ — quiet hours + backup contact added; still only partial (no full org-wide rule engine).
- **Billing UI** — doesn't exist (billing is flat fee + per-client rate, set up via Stripe, no in-app UI).
- **Integrations UI (Twilio/email config)** — doesn't exist; app still tells providers to configure Twilio secrets directly in Supabase.
- **Branding/whitelabel** — only exists as a fake preview in the sandbox demo, not in the real app.
- **Data retention policy UI** — doesn't exist.
- **Audit log UI** (system activity trail) — still doesn't exist as such, but Platform Activity (above) is a first step toward founder-level visibility, just not a full audit trail yet. Don't confuse with `AuditReadiness.jsx` (self-assessment checklist).

## Known infrastructure notes
- **Deploys are now automatic** — GitHub Actions deploys to Vercel on every push to `master` (fixed 8/10-ish, bypassing the broken Vercel↔GitHub account link). No more manual `vercel --prod` step needed.
- The app lives at `app.courtbridgesolutions.com`. The bare `courtbridgesolutions.com` is a **separate marketing site**, different codebase, not in this repo (though a backup of its source was added under `marketing-site/` on 8/7).
- GitHub's default branch is still `main` (old, stale marketing page) — real development happens on `master`. Worth switching the default branch to `master` at some point.
- **Monitoring**: no always-on alerting yet. Vercel/Supabase dashboards have built-in email notification toggles (Project Settings → Notifications) that haven't been turned on. A session-scoped background health check (Vercel runtime errors + Supabase logs/advisors, pings Shannon's phone via push notification) exists but only runs while a Claude Code session is open — not persistent.
