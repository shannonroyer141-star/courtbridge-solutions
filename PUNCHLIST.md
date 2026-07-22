# CourtBridge Punch List

_Last updated: 2026-07-21. The original punch list from an earlier session was lost, so this one was rebuilt by actually auditing the codebase — it's accurate as of this date._

## ✅ Done & working
Dashboard, Clients, Check-Ins, Map View, Alerts, Reports, Drug Tests, Tasks, Court Dates, Calendar, Affirmations, Settings, Contact Log, Programs, PO Visits, CPS Tracking, Compliance Chart, Meeting Log, Client Profile, Messages (two-way + urgent SMS alert to provider's phone), Client Invites, Violation Reports, Founder Docs, Org Settings (basic profile), client-side portal (onboarding, check-in, messaging).

## 🟡 Built but not linked into the app's navigation
Real code exists for these, but nothing in the menu points to them — either finish wiring them in, or delete them if they're not needed:
- Document Upload
- Completion Certificates
- SMS Alerts (separate screen from Messages — likely redundant now that Messages handles urgent SMS)
- Assessments (reference info only, marked "Phase 2")

## ❌ Still just placeholder stubs
These show "This screen is being built. Check back soon." — no real functionality yet:
- SOPs
- Provider Guide
- Policies
- Legal
- Non-Compete
- Client Intake

## 🗑️ Dead code — safe to delete
Not linked anywhere, superseded by other screens:
- `src/screens/Dashboard.jsx` (has a bug, replaced by `ProviderDashboard.jsx`)
- `src/screens/App.jsx` (orphaned duplicate of the real `src/App.jsx`)

## 📋 Planned next: "Workflow Studio"
Combine the Admin, Operations, and Settings nav sections into one area called **Workflow Studio**, split into three tiers:
- **Org-wide** (affects every user under the org, higher-risk, changed rarely): Org Settings, User & Role Management, Compliance Config (check-in requirements, geofence radius, missed-checkin thresholds, escalation rules), Integrations (Twilio/email config), Billing. Should be gated to org-admin role only.
- **Operational**: Tasks, Programs, Client Invites.
- **Personal** (any provider, affects only themselves): notification prefs, own name/password, personal dashboard layout (customizable per-user).

Gap check on "Org Settings" specifically (done 2026-07-21, re-verify before trusting if much time has passed):
- Org profile: mostly exists, missing logo.
- User & role management: database fields exist (`profiles.role`/`org_role`/`is_org_admin`, plus a `staff_personnel` table), but **no UI screen** — needs to be built.
- Compliance config: partial (per-client check-in frequency, per-program geofencing exist; no org-wide escalation rules).
- Billing, Integrations UI, Branding/whitelabel, Data retention policy, Audit log: **none of these exist yet** — new features, not restyles.

## Known infrastructure notes
- Deploys are currently **manual only** — the GitHub repo isn't connected to Vercel's auto-deploy (account-linking issue between two different GitHub accounts). Until that's fixed, changes need to be deployed by hand.
- The app lives at `app.courtbridgesolutions.com`. The bare `courtbridgesolutions.com` is a **separate marketing site**, not this app.
- GitHub's default branch is `main` (old, stale marketing page) — real development happens on `master`. Worth switching the default branch to `master` at some point.
