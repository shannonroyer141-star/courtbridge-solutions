<!-- Backup mirror of the live founder_docs.sop row. The app reads from Supabase, not this file — edit in-app (Founder Docs screen), then re-sync here. Last synced 2026-08-06. -->

# Standard Operating Procedures
DRAFT, review before relying on this

1. NEW CLIENT ENROLLMENT
   - Use "Enroll Client" (Client Invites) to run the 3-step wizard: participant info -> program requirements -> review & send. As of 2026-07-31, step 2 lets you link the invite to one of your real Programs -- do this when you can, since it means the client's Journey/progress tracking is created automatically the moment they accept, with no manual follow-up step needed. If you skip it, you'll still need to add their program manually afterward.
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

8. WHERE THE PLATFORM ACTUALLY LIVES
   - As of 2026-08-06, the entire platform is backed up in the GitHub repo -- not just the app code (which was always there), but also the full database schema (every migration, as real files) and all 5 backend functions (send-email, send-invite, send-sms, create-checkout-session, stripe-webhook). Before this, half the platform only existed inside Supabase with no copy anywhere else -- a real single point of failure that's now closed.
   - Deploys happen automatically on every push to master via GitHub Actions. If a deploy ever fails, check whether it's a real code problem or an outage on GitHub's own side (githubstatus.com) before assuming something's broken -- confirmed this happened for real on 2026-08-06.

9. VICTIM INFORMATION -- WHAT NOT TO ENTER
   - CourtBridge tracks program participants only. Never enter victim names, contact info, addresses, locations, safety plans, or info about a victim's children/household members anywhere in the platform -- notes, messages, and uploaded documents included.
   - Every notes field and document upload shows a warning before you type or upload. Read it, don't click past it.
   - If victim information gets entered or uploaded by mistake, use the "Flag as possible victim information" button right on that record. This immediately hides it from everyone except an org admin/founder -- it does NOT delete it. Flag it yourself the moment you notice, don't wait for someone else to catch it.
   - Only an org admin or founder can review and resolve a flagged record, on the Victim Info Review screen (sidebar, admin accounts only). A manual flag-by-record form is there too, for the rare screen that doesn't have its own flag button.

10. GPS / LOCATION DATA
   - Location is only captured the moment a client taps Check In/Check Out -- never continuous or background tracking. Clients see this explained directly during consent.
   - Most screens show "GPS Verified" instead of raw coordinates. Exact coordinates only appear on the Map View screen and through explicit "view on map" links -- both are logged (who viewed, when) for audit purposes.
   - How long location data gets kept is still undecided (see Policies.md Section 4/5) -- don't promise a specific retention period to a client or court until that's actually settled.
