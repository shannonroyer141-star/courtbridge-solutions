# CourtBridge Punch List

_Last updated: 2026-07-28 (afternoon), after a full day of fixes/cleanup on top of the 7/27 session._

## ✅ Done & working
Dashboard, Clients, Check-Ins, Map View, Alerts, Reports, Drug Tests, Tasks, Court Dates, Calendar, Affirmations (Wellness), Settings (My Preferences), Contact Log, PO Visits, CPS Tracking, Compliance Chart, Meeting Log, Client Profile, Messages (two-way + urgent SMS alert to provider's phone, now with proper failure feedback), Client Invites (with pending-count badge), Violation Reports, Founder Docs (founder-only), Org Settings (now with an editable IT contact), client-side portal (onboarding, check-in, messaging), Client Intake + Send Enrollment Link (shared logic, no more duplicate bugfixes), Completion Certificates (template library + preview popup — **Shannon doesn't like the current designs, revisit later**), SMS Alerts, Case/Clinical Notes, Staff Credentialing, Compliance Requirements, Funding Sources, Audit Readiness (self-scored checklist, not a system audit trail), Programs (moved out of founder-only into the regular Clients nav group), Assessments (re-linked into nav under Sensitive Records — still Phase 2 reference-only, no data entry).

## 🎨 Next up: redesign Completion Certificates
Shannon flagged 2026-07-28 that the certificate template designs aren't good — revisit the visual design of the 4 templates in `CompletionCertificate.jsx`. No specifics given yet on what's wrong or what direction to take; ask before redesigning.

## 🎨 Color consistency — done 2026-07-28
Converted the platform's accent palette to blue-only (kept red/green for actual status meaning). Renamed `theme.js`'s `ORANGE` token to `WARNING` (`#3D6FA8`), fixed matching rgba tints, and converted category colors (Assessments, SensitiveNotes, Calendar) to blue shades. Printable document templates (certificates, printed reports) and the sandbox's customer branding-color picker were intentionally left alone — different category, not app chrome.

## 🧹 Cleanup done 2026-07-28
- `SensitiveNotes.jsx` dead "coming soon" branch — removed.
- `ClientAppDashboard.jsx` silent-failure urgent SMS — now shows a warning if the alert fails instead of a false "sent" confirmation.
- `OrgAdmin.jsx` IT contact — now editable (name/email), saved to `profiles.it_contact_name`/`it_contact_email` (columns added to Supabase 7/28).
- `ClientIntake.jsx` / `SendEnrollmentLink.jsx` duplication — consolidated shared constants/validation/DB-write logic into `src/enrollment.js`.
- Sandbox demo (`SandboxApp.jsx`) — synced to the real app's dark theme (was still light-themed on provider-facing screens).

## 🧹 Still open
- `ClientOnboarding.jsx`: waiver and SMS-consent text both still marked `⚠ Placeholder — needs legal review before use` — left as-is intentionally, tracked until legal review happens.
- **SOP**: still an open question — does Shannon want the Founder Docs app content updated, or the draft `founder-docs/SOP.md` file? No content direction given yet either way.
- Several pre-existing lint errors unrelated to today's work (SMSAlerts unused var, Settings.jsx hook-hoisting issue, StaffCredentialing duplicate `color` keys in 3 style objects, SensitiveNotes setState-in-effect) — not touched today, worth a cleanup pass sometime.

## 📋 Planned next: "Workflow Studio" — still fully open
Combine Admin/Operations/Settings into one area, three tiers (Org-wide, Operational, Personal). Nothing on this list has been resolved yet:
- **User & Role Management UI** — still no screen. DB fields exist (`profiles.role`/`org_role`/`is_org_admin`, `staff_personnel` table) but no way to assign roles in the app.
- **Org-wide escalation rules** — still doesn't exist (only per-client check-in frequency + per-program geofencing are configurable).
- **Billing UI** — doesn't exist.
- **Integrations UI (Twilio/email config)** — doesn't exist; app still tells providers to configure Twilio secrets directly in Supabase.
- **Branding/whitelabel** — only exists as a fake preview in the sandbox demo, not in the real app.
- **Data retention policy UI** — doesn't exist.
- **Audit log UI** (system activity trail) — doesn't exist. (Don't confuse with `AuditReadiness.jsx`, which is a self-assessment checklist, not an activity log.)

## Known infrastructure notes
- Deploys are currently **manual only** — the GitHub repo isn't connected to Vercel's auto-deploy (account-linking issue between two different GitHub accounts). Deploy process (confirmed working 7/28): commit + push to `master`, then `NODE_OPTIONS="--use-system-ca" npx vercel --prod` from `src/screens/` (the `--use-system-ca` flag works around a local TLS/cert issue on this machine — without it, Vercel CLI calls fail with a certificate verification error).
- The app lives at `app.courtbridgesolutions.com`. The bare `courtbridgesolutions.com` is a **separate marketing site**, not this app — different codebase entirely, not present in this repo.
- GitHub's default branch is `main` (old, stale marketing page) — real development happens on `master`. Worth switching the default branch to `master` at some point.
