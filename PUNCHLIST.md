# CourtBridge Punch List

_Last updated: 2026-07-28, re-audited against the actual codebase after a big work session on 2026-07-27 (24 commits). Repo root is `src/screens/` itself — confirmed via git._

## ✅ Done & working
Dashboard, Clients, Check-Ins, Map View, Alerts, Reports, Drug Tests, Tasks, Court Dates, Calendar, Affirmations (Wellness), Settings (My Preferences), Contact Log, PO Visits, CPS Tracking, Compliance Chart, Meeting Log, Client Profile, Messages (two-way + urgent SMS alert to provider's phone), Client Invites (with pending-count badge), Violation Reports, Founder Docs (founder-only), Org Settings, client-side portal (onboarding, check-in, messaging), Client Intake (full 4-step wizard, wired into nav), Completion Certificates (now with a real template library + preview popup, wired into nav), SMS Alerts (now wired into nav), Case/Clinical Notes (Clinical Notes type now live, no longer "coming soon"), Staff Credentialing (new, full CRUD), Compliance Requirements (new), Funding Sources (new), Audit Readiness (new — note: this is a self-scored readiness checklist, not a system audit trail).

## 🟡 Built but not linked into the app's navigation
- **Programs** — real, fully built (got one-click program templates added 7/27), but only visible under the **Founder** nav group. Regular providers/org-admins can't reach it. Decide: move it to a normal nav group, or is founder-only intentional?
- **Assessments** — still just a reference list of clinical assessment tool names, explicitly labeled "Phase 2 Development." Now also fully orphaned — not imported/routed anywhere in `App.jsx` at all (it was linked as of 7/21, isn't anymore).

## ❌ Still just placeholder stubs
- **Assessments** only. (SOPs, Provider Guide, Policies, Legal, Non-Compete were deleted back on 7/22 and replaced by the founder-only Founder Docs library — that's real functionality now, just gated to founder accounts. Client Intake is fully built, not a stub.)

## 🧹 Cleanup found in this audit (not on old list)
- `SensitiveNotes.jsx` has vestigial "Clinical Notes isn't built yet" dead-code branch left over from before Clinical Notes went live — `comingSoon` is never set anymore, so the branch can't render. Safe to delete.
- `ClientAppDashboard.jsx` (line ~278): the urgent-SMS-to-provider call fails silently (`.catch(() => {})`) — client always sees "Message sent" even if the alert didn't go out. Notable since 5 commits yesterday were specifically about fixing silent-failure patterns elsewhere, but this one was missed. Also hardcodes the Supabase functions URL instead of deriving it from the client config.
- `ClientOnboarding.jsx`: waiver and SMS-consent text both still marked `⚠ Placeholder — needs legal review before use`, shown live in the UI.
- `OrgAdmin.jsx` (line ~177): literal `[IT Contact Name/Email — to be filled in]` placeholder shown to every provider.
- `ClientIntake.jsx` and `SendEnrollmentLink.jsx` are near-duplicate implementations of the same enrollment flow (one as a nav screen, one as a modal from Clients). Any future bugfix has to be applied twice until one is consolidated or the other deleted.

## 📋 Planned next: "Workflow Studio" — still fully open
Combine Admin/Operations/Settings into one area, three tiers (Org-wide, Operational, Personal). Re-checked every item from the last audit — **nothing on this list got resolved by yesterday's work**, despite yesterday adding several org-level features:
- **User & Role Management UI** — still no screen. DB fields exist (`profiles.role`/`org_role`/`is_org_admin`, `staff_personnel` table) but no way to assign roles in the app.
- **Org-wide escalation rules** — still doesn't exist (only per-client check-in frequency + per-program geofencing are configurable).
- **Billing UI** — doesn't exist.
- **Integrations UI (Twilio/email config)** — doesn't exist; app still tells providers to configure Twilio secrets directly in Supabase.
- **Branding/whitelabel** — only exists as a fake preview in the sandbox demo, not in the real app.
- **Data retention policy UI** — doesn't exist.
- **Audit log UI** (system activity trail) — doesn't exist. (Don't confuse with the new `AuditReadiness.jsx`, which is a self-assessment checklist, not an activity log.)

Yesterday's `c077bde` (Compliance Requirements / Funding Sources / Audit Readiness) and `ed31b85` (Staff Credentialing / Clinical Notes) added real org-facing features but none of them close a Workflow Studio gap — they're adjacent, not overlapping.

## 🎨 Sandbox demo
`src/demo/SandboxApp.jsx` is a separate, self-contained investor/marketing demo with fake mock data — not the real app. It got a branding-customization step added 7/27 (`8f24223`), but hasn't been checked against everything else that shipped yesterday (dark login, certificate template library, new compliance screens, etc.). **Needs a pass to make sure it still reflects the real app accurately.**

## Known infrastructure notes
- Deploys are currently **manual only** — the GitHub repo isn't connected to Vercel's auto-deploy (account-linking issue between two different GitHub accounts). Until that's fixed, changes need to be deployed by hand.
- The app lives at `app.courtbridgesolutions.com`. The bare `courtbridgesolutions.com` is a **separate marketing site**, not this app.
- GitHub's default branch is `main` (old, stale marketing page) — real development happens on `master`. Worth switching the default branch to `master` at some point.
