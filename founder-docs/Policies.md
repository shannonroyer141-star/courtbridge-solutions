<!-- Backup mirror of the live founder_docs.policies row. The app reads from Supabase, not this file — edit in-app (Founder Docs screen), then re-sync here. Last synced 2026-08-06. -->

# Policies
DRAFT, written by Claude at Shannon's direction 2026-07-31. Not reviewed by an attorney or compliance specialist -- read alongside Legal & Compliance Notes before treating this as final or official.

## 1. Data Handling & Client Privacy
- Every client record (compliance history, GPS check-in points, and sensitive categories like drug tests, CPS involvement, or mental health program enrollment) is confidential. Staff may only access what their role actually requires -- the platform enforces this at the account level (role-based access, the Sensitive Records section is restricted).
- Do not discuss a specific client outside documented, work-related channels (in-app notes, official meetings). Never over personal text, email, or casual conversation -- even with a coworker who "already knows" the client.
- Location data is captured only at the moment a client taps Check In/Check Out. Never represent this to a client, court, or funder as continuous tracking -- it isn't.
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

## 5. Victim Information Prohibition
- CourtBridge is not a victim-services system and must never create victim profiles or knowingly collect, store, process, display, export, or transmit victim-identifying information (names, contact info, addresses, locations, safety plans, medical/behavioral-health info, or info about a victim's children/household members).
- Participant records are limited to the participant's own program requirements, attendance, compliance, completion, and authorized administrative info.
- If victim information is submitted by mistake, it gets flagged Restricted, hidden from ordinary users immediately, and reviewed by an authorized privacy administrator -- never auto-deleted, in case of a legal-preservation requirement.
- Every notes field and document upload in the app shows a standing warning against entering victim information; uploads require an explicit reviewed-and-redacted confirmation before they're allowed to complete.
