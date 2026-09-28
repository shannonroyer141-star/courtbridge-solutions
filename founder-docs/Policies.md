<!-- Backup mirror of the live founder_docs.policies row. The app reads from Supabase, not this file — edit in-app (Founder Docs screen), then re-sync here. Last synced 2026-08-20. -->

# Policies
DRAFT, written by Claude at Shannon's direction 2026-07-31. Not reviewed by an attorney or compliance specialist -- read alongside Legal & Compliance Notes before treating this as final or official.

## 1. Data Handling & Client Privacy
- Every client record (compliance history, GPS check-in points, and sensitive categories like drug tests, CPS involvement, or mental health program enrollment) is confidential. Staff may only access what their role actually requires -- the platform enforces this at the account level (role-based access, the Sensitive Records section is restricted).
- Do not discuss a specific client outside documented, work-related channels (in-app notes, official meetings). Never over personal text, email, or casual conversation -- even with a coworker who "already knows" the client.
- Location data is captured only at the moment a client taps Check In/Check Out. Never represent this to a client, court, or funder as continuous tracking -- it isn't.
- Providers cannot log into or view a client's account. The client's private journal ("My Thoughts") is never visible to providers, staff, or org admins -- this is a deliberate part of CourtBridge's "safe space" commitment to clients, not a gap. A founder-only diagnostic login exists for testing/support purposes and is not available to ordinary provider accounts; extending any client-account-visibility tool to providers is an open decision that has not been made yet.
- Staff accounts are individual, never shared. If someone leaves the organization, deactivate their account the same day. (2026-08-06: confirmed this is enforced at the database level, not just hidden in the UI -- a deactivated or non-admin account cannot reactivate or promote itself even via a direct API call. Tested and verified, not just assumed.)

## 2. Response Time Standards
- Urgent client messages (flagged "Mark Urgent"): respond within [Shannon to set a real target -- e.g. same business day, or within 1 hour during business hours]. This is the platform's core safety commitment -- treat it as higher priority than routine work.
- Missed check-ins: reviewed daily via Alerts. First missed check-in gets direct outreach (call or message) the same day if possible, next business day at the latest.
- Routine client messages (not urgent): same business day.
- These are internal targets, not a guarantee to a court or funder unless a specific contract requires it -- confirm internally before promising a response time externally.

## 3. Sensitive Records Access
- The Sensitive Records group (Drug Tests, PO Visits, CPS Tracking, Violations, Documents, Case/Clinical/Legal Notes) holds the most restricted, client-identifying information in the system. Only staff who need it for their actual role should have access.
- Clinical/diagnostic content belongs only in Case/Clinical Notes -- never in Progress Notes (which clients can see) or the general Contact Log.
- Progress Notes have a "Share with client" toggle; unshared notes are enforced private at the database level. Don't treat that as license to write something you wouldn't want a client to eventually see -- write as if it could be seen.
- CPS Tracking and Violation Reports should only be discussed with staff directly involved in that client's case, plus the referring agency/court as required.

## 4. Record Retention
- Not yet decided. How long check-in/compliance data should be kept (and when/whether it's ever deleted) depends on state law and individual program/funder requirements, which haven't been researched yet. Do not delete client history without a real answer here first -- when in doubt, keep it. Needs a real decision from Shannon (and likely a quick legal check), not a guess.

## 5. Victim Information: Notification Records Only
- CourtBridge is not a victim-services system. It does not keep victim profiles, safety plans, locations, shelter information, medical/counseling/behavioral-health info, or info about a victim's children/household members.
- **Exception -- certified Batterers' Intervention Programs (BIPs) only.** Florida Rule 65H-2.016(8), F.A.C., requires BIPs to notify the victim within 3 business days of a participant's enrollment and within 24 hours of discharge, and to keep a dated record of each notice. To meet that rule, a BIP provider may record only:
  - The victim's name.
  - One contact method (mailing address, email, or phone).
  - Where that contact information came from. It must come from the referral source, court documents, or the police report -- never from the participant (65H-2.016(8)(a)).
  - Whether the victim wants updates on the participant's progress, non-compliance, and discharge.
  - Each notice: date, method, sent or attempted, and confirmation that the required contacts and statements were included.
- **How notification records are protected:**
  - Kept in their own restricted Victim Notifications section, separate from the participant file.
  - Visible only to provider staff given victim-notification permission.
  - Never visible to participants -- enforced at the database level, not just hidden in the screen.
  - Never shown in notes, messages, court reports, rosters, DCF monitoring exports, or any participant-facing screen.
  - The copy of each notice kept in the participant file leaves out the victim's contact information (65H-2.016(8)(d)).
  - Every view or change is written to the audit log.
  - Kept at least 5 years after the participant's discharge, matching the participant-file rule (65H-2.016(9)(c)).
- **Everything else is still prohibited.** No victim information in notes, messages, check-ins, or uploads outside the Victim Notifications section.
- Participant records are limited to the participant's own program requirements, attendance, compliance, completion, and authorized administrative info.
- If victim information is submitted by mistake, it gets flagged Restricted, hidden from ordinary users immediately, and reviewed by an authorized privacy administrator -- never auto-deleted, in case of a legal-preservation requirement.
- Every notes field and document upload in the app shows a standing warning against entering victim information; uploads require an explicit reviewed-and-redacted confirmation before they're allowed to complete.
