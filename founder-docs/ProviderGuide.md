<!-- Backup mirror of the live founder_docs.provider_guide row. The app reads from Supabase, not this file — edit in-app (Founder Docs screen), then re-sync here. Last synced 2026-07-30. -->

# Provider Guide
DRAFT, review before relying on this

Welcome to CourtBridge. Quick orientation to what's where:

DASHBOARD — your daily snapshot: active clients, checked-in-today count, missed check-ins, open alerts. Also includes a small map of last-known check-in locations, an Urgent Messages card (clients whose most recent message is an unanswered urgent one), and a "Coming Up" list of court dates/tasks due in the next 7 days.

CLIENTS — full participant list, enroll new clients (Client Intake), and open a client's full profile for detail and history. Click "View Full Profile & Journey" on any client to reach:
  - JOURNEY — track each client's actual court orders (a client can have several running at once, e.g. a primary program plus an accompanying CPS requirement), each with a start date and progress bar. "Mark Complete" is a manual action (the court/PO decides, not the software) that awards an achievement badge and auto-generates a Completion Certificate with a real check-in count.
  - PROGRESS NOTES — short, plain-language session recaps you write for the client to read (separate from Case/Clinical Notes — never put clinical/diagnostic content here). Each note has a "Share with client" toggle; unshared notes are enforced private at the database level, not just hidden in the UI.
  - SIGNED FORMS — any forms that client has electronically signed (see Forms & Signatures below).
  - STATUS — Mark Inactive / Terminate (soft only — nothing is ever deleted, all history stays intact) and Reactivate for a returning client, which only asks you to confirm/update their address and phone rather than redoing full intake.

MESSAGES — two-way messaging with each client. Clients can mark a message "urgent," which texts your phone immediately (set your number in Settings).

FORMS & SIGNATURES (under Clients) — build a reusable library of forms once (Waiver, Release of Information, Media Consent, etc.). Clients sign electronically from their own app; each signature is a permanent record with the exact form text they agreed to (editing a template later doesn't change what was already signed).

COMPLIANCE group — Alerts (missed check-ins), Check-Ins (full log), Map View (GPS locations of recent check-ins), Reports (printable court report), Compliance Chart (30-day rates).

SENSITIVE RECORDS group — Drug Tests, PO Visits, CPS Tracking, Violations, Documents, and Case/Clinical/Legal Notes. Kept separate because this is the most restricted, client-identifying information in the system. Documents now works end-to-end (upload, secure signed-URL viewing) — clients can also see files you've shared with them under their own "My Documents" tab.

CALENDAR — currently a manual, separate list (click "+ Add Event"). It does NOT yet pull in real Court Dates or Tasks automatically, so entries have to be added twice if you want them in both places. Known gap, not yet fixed.

CALENDAR / TASKS / PROGRAMS — general scheduling and program management, not tied to a specific client.

SETTINGS — your own notification preferences, alert email, and phone number for urgent alerts.

ORG SETTINGS — organization profile, IT troubleshooting reference, and a Data Security & Privacy note you can point to if a client or staff member asks how their data is protected.

FOUNDER (only visible to founder accounts) — Founder Docs (this library) and Business Organizer (your own private to-dos, quick notes, and vendor account reference — never store passwords there, use a password manager).

Questions or something looks broken? See the IT Troubleshooting section under Org Settings first — it covers the most common issues.
