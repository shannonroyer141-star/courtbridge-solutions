<!-- Backup mirror of the live founder_docs.sop row. The app reads from Supabase, not this file — edit in-app (Founder Docs screen), then re-sync here. Last synced 2026-07-30. -->

# Standard Operating Procedures
DRAFT, review before relying on this

1. NEW CLIENT ENROLLMENT
   - Use Client Intake to collect participant info and program requirements.
   - The system generates a 48-hour enrollment link — text or email it to the client.
   - Confirm they complete account setup (check Clients > All Clients for "Enrolled" status).

2. MISSED CHECK-IN RESPONSE
   - Check Alerts daily. A client shows up there once they miss their required check-in window.
   - First missed check-in: contact the client directly (Messages or phone), log it in Contact Log.
   - Repeated misses: consider a Violation Report (Sensitive Records > Violations).
   - Note: as of 2026-07-30, check-ins made with no phone signal/internet are saved on the client's device and sync automatically once they're back online -- the timestamp still reflects when they actually checked in, but it may not appear in your log until later. Don't treat a late-appearing check-in as a miss without asking the client first.

3. URGENT CLIENT MESSAGES
   - When a client marks a message "urgent," the provider's phone (set in Settings) gets a text automatically.
   - Respond as soon as possible — treat as higher priority than routine messages.

4. DOCUMENTING CLIENT CONTACT
   - Any phone call, in-person meeting, or significant text exchange goes in Contact Log.
   - Court dates, PO visits, and CPS involvement each have their own dedicated screens under Sensitive Records / Clients — use those instead of Contact Log for those specific event types.

5. COURT-READY REPORTING
   - Reports screen generates a check-in history report per client for court/PO submission.
   - Compliance Chart gives a 30-day rolling compliance percentage per client.

6. ESCALATION
   - Repeated non-compliance or a serious incident → Violation Report, then notify your supervisor/the referring agency per your program's own escalation policy (define this separately — not yet written).

7. CERTIFICATE DESIGN FOR NEW PROVIDERS
   - Providers pick from 8 certificate designs (Navy & Gold Classic, Ivory Elegant, Modern Minimal, Bold Achievement, Emerald Formal, Burgundy Heritage, Slate Corporate, Terracotta Warm) themselves, right in the "Issue Certificate" form -- no setup needed from you.
   - All designs print in true landscape and pull the provider's own organization name automatically -- no hardcoded branding.
   - Default is Navy & Gold Classic if they don't choose. The design is saved per certificate, so past certificates always reprint the way they were issued even if the provider picks a different one next time.
   - Full custom branding (their own logo/colors) is planned but not built yet -- for now it's a pick-from-library choice, not true customization.
