# CourtBridge Solutions — Standard Operating Procedures

Internal reference for onboarding provider organizations and running day-to-day operations on the platform. Copy relevant sections into the app's Founder Docs screen as needed.

---

## 1. Provider Org Onboarding

1. **Create the org.** Set up the provider organization record with name, address, phone, and license info (Org Settings).
2. **Set up the first admin account.** The founding user gets `is_org_admin` and role access to all org-wide settings.
3. **Add staff.** Enter staff/personnel records with license numbers, training, and background-check status (Staff Credentialing).
4. **Configure programs.** Add the program types this org runs — pick from the common templates (BIP, DUI/DWI, Drug Court, Mental Health Court, Veterans Court, Anger Management, Substance Abuse, DV Victim-Offender, Probation Compliance, Reentry) or create a custom one. Set duration, frequency, and — if check-in location matters for that program — the approved GPS location and allowed radius.
5. **Set compliance basics.** Fill out Compliance Requirements and Funding Sources so Audit Readiness has something to check against from day one.
6. **Verify contact channels work.** Confirm the org's phone number is set (for urgent alerts) and send a test email/SMS before onboarding any real clients.
7. **Time to first value target:** an org should be able to go from account creation to sending their first client invite in under 15 minutes. If it's taking longer, that's a product gap worth fixing, not a training gap.

## 2. Client Enrollment

1. Send an enrollment link (Client Invites) or manually create the client record (Client Intake).
2. Assign the client to a program.
3. Set their check-in frequency and, if applicable, approved check-in location/radius.
4. Have the client acknowledge the program waiver during intake.
5. Confirm the client's phone number is entered correctly — this is what urgent SMS alerts and check-in reminders depend on. **A wrong digit here means a missed alert**, so double-check it during intake rather than after a problem occurs.
6. Walk the client through their first check-in together if possible, so any GPS/permission issues on their phone surface immediately instead of during a real compliance window.

## 3. Daily Operations

- **Check-ins**: Review the Check-In Log daily. A missed check-in isn't necessarily a violation — but a pattern of missed check-ins is a compliance signal that should be documented (Contact Log or Violation Report) and, if serious, escalated per Section 4.
- **Messages**: Treat client messages as a same-business-day response expectation. The inbox has no SLA enforcement built in yet — that's a manual discipline until the platform adds one.
- **Map View**: Use for spot-checking whether check-ins are happening from approved locations, not as a live surveillance tool — it's a compliance record, not a tracking device.
- **Tasks**: Use for anything that needs follow-up beyond a single day (a document to collect, a call to return).

## 4. Urgent Alert / Escalation Response

This is the platform's core safety feature and deserves the tightest process of anything in this doc.

**How it actually works:** There's no separate "panic button" — it's a checkbox on the client's Messages screen labeled *"Mark urgent — notifies your provider immediately."* When a client checks it and sends a message, three things happen: (1) the message is flagged and shows with a red border in the thread, (2) that client's conversation jumps to the top of the provider's Messages inbox, and (3) a real text message fires to the provider's phone reading *"URGENT message from [Client Name] in CourtBridge: [their message]."* If the text fails to send — no provider phone number on file, or a Twilio issue — the client sees a warning that it may not reach the provider right away, but the message itself is still saved and visible in-app.

**This only works if the provider's phone number is entered in Settings.** Confirm this during onboarding (Section 1) — a provider with no phone number set has effectively no urgent-alert coverage, with no error surfaced anywhere except to the client at the moment they try to use it.

1. An urgent ping from a client should be checked **within minutes**, not at end of day — this is what separates CourtBridge from a generic check-in app.
2. On receiving an urgent alert: contact the client directly (phone, not just in-app message) to assess the situation.
3. Document what happened — in Contact Log if it's routine, in Violation Report if it affects program compliance, in CPS Tracking if it involves a child welfare concern.
4. If the situation involves immediate safety risk, this platform is a documentation tool, not a crisis-response system — call 911 or the appropriate crisis line first, document after.
5. **Known current limitation:** urgent SMS only reaches clients whose numbers are verified in Twilio (trial account). Providers should know which of their clients can currently receive a text alert and which can't, until the account is upgraded.

## 5. Data Privacy & Security

- Client data here includes court-mandated program status, compliance history, and in some programs, sensitive categories (CPS involvement, substance use, mental health program enrollment). Treat all of it as confidential — don't discuss specific clients outside of documented, work-related channels.
- Only staff who need access for their role should have it (role-based access, not shared logins).
- This platform is not currently CJIS-certified. If a probation department, court, or funding source specifically requires CJIS compliance as a condition of use, that's a conversation to have with Shannon before agreeing to it — it has real technical and procedural requirements beyond what's built today.
- Report any suspected data exposure (wrong client visible to wrong provider, etc.) immediately rather than waiting to see if it happens again.

## 6. Support & Troubleshooting

- Client can't check in / GPS not working → confirm location permissions are enabled on their phone first; most "broken check-in" reports are a phone permission issue, not a platform bug.
- Client didn't get an SMS alert → check whether their number is verified in Twilio (see Section 4).
- Anything that looks like a genuine bug (data not saving, wrong info showing) → document exactly what was clicked and what happened, so it can be reproduced and fixed quickly.

---
*Draft — last written 2026-07-29. Review and revise as real onboarding experience surfaces gaps in this process.*
