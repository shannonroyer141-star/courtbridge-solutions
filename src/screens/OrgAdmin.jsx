import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ISSUES = [
  {
    category: 'Client Login & Enrollment',
    items: [
      {
        problem: 'Client says their enrollment link is "invalid or expired."',
        steps: [
          'Check the Client Invites screen — confirm the invite status is still "Pending" and not already "Signed Up."',
          'Invite links expire 7 days after being sent. If expired, click "Resend" to generate a fresh link.',
          'Confirm the client is opening the link on the device/browser they intend to use going forward — the link itself is not device-locked, but old cached pages can cause confusion.'
        ]
      },
      {
        problem: 'Client can\'t log in after completing enrollment.',
        steps: [
          'Confirm they completed both steps: creating their password AND clicking the confirmation link in the account-verification email Supabase sends.',
          'Have them check spam/junk folders for the confirmation email.',
          'If they forgot their password, use the "Forgot Password" flow on the login screen (if enabled), or contact IT to manually trigger a reset.'
        ]
      }
    ]
  },
  {
    category: 'GPS Check-Ins',
    items: [
      {
        problem: 'Client says GPS check-in won\'t capture their location.',
        steps: [
          'Have them confirm location permissions are enabled for their browser (Settings > Site Permissions > Location) — this is the most common cause.',
          'Ask them to try a hard refresh of the check-in page.',
          'If on iPhone, confirm Location Services are on system-wide (Settings > Privacy > Location Services).'
        ]
      },
      {
        problem: 'A check-in appears in the log but with no location shown.',
        steps: [
          'This means the check-in was submitted, but GPS coordinates failed to attach — usually a permissions issue on the client\'s device at the moment they checked in.',
          'No data is lost — the check-in timestamp is still accurate and valid for compliance purposes.'
        ]
      }
    ]
  },
  {
    category: 'Alerts & Reporting',
    items: [
      {
        problem: 'A client who has clearly missed check-ins isn\'t showing up under "Needs Attention" or in Alerts.',
        steps: [
          'Confirm the client\'s status is set to "active" — inactive/graduated/terminated clients are excluded from alert logic.',
          'Confirm a check-in frequency/schedule is set on that client\'s profile.',
          'If it still looks wrong, this may be a data/schema issue — contact IT with the client\'s name and expected vs. actual behavior.'
        ]
      },
      {
        problem: 'A compliance report or PDF export looks incomplete or shows placeholder data.',
        steps: [
          'Confirm the date range selected actually covers the check-ins/events you expect to see.',
          'Refresh the page and re-generate the report before assuming data is missing.',
          'If numbers still look wrong, contact IT — do not submit a report to a court or partner until verified.'
        ]
      }
    ]
  },
  {
    category: 'Messaging & Notifications',
    items: [
      {
        problem: 'Client invite emails or messages aren\'t arriving.',
        steps: [
          'Have the client check spam/junk folders first — this resolves the majority of "missing email" reports.',
          'Confirm the email address on file is spelled correctly.',
          'If a client still hasn\'t received anything after 15 minutes, use "Resend" from Client Invites, or contact IT to check email delivery logs.'
        ]
      }
    ]
  },
  {
    category: 'Website & Public-Facing Site',
    items: [
      {
        problem: 'courtbridgesolutions.com appears down, shows an error, or looks outdated.',
        steps: [
          'Try a hard refresh (Ctrl+Shift+R) and/or an incognito window first — this resolves most "looks wrong" reports, which are usually just browser caching.',
          'If it\'s still wrong after that, contact IT immediately — this is client/partner-facing and should be treated as high priority.'
        ]
      },
      {
        problem: 'A prospective partner says the contact form on the website didn\'t go through.',
        steps: [
          'Check the info@courtbridgesolutions.com inbox (and spam folder) for a submission from Formspree.',
          'If nothing arrived, contact IT — the form\'s email delivery integration may need to be checked.'
        ]
      }
    ]
  }
]

export default function OrgAdmin({ session }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openCategory, setOpenCategory] = useState(null)

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
    setLoading(false)
  }

  const BLUE = '#1B3A6B'

  const field = (label, value) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111827' }}>{value || <span style={{ color: '#D1D5DB' }}>Not set</span>}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>Org Settings</div>
        <div style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Organization profile and IT troubleshooting reference</div>
      </div>

      {/* ORGANIZATION PROFILE */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Organization Profile</div>
        {loading ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {field('Organization Name', profile?.organization_name)}
            {field('Contact Name', profile?.contact_name)}
            {field('Email', profile?.email)}
            {field('Phone', profile?.phone)}
            {field('Address', profile?.address)}
            {field('City / State / Zip', [profile?.city, profile?.state, profile?.zip].filter(Boolean).join(', '))}
            {field('Program Type(s)', profile?.program_types)}
            {field('License Number', profile?.license_number)}
            {field('Website', profile?.website)}
            {field('Alert Email', profile?.alert_email)}
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
          To update these details, contact IT or use Settings.
        </div>
      </div>

      {/* IT CONTACT */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '18px 24px', marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>IT / Technical Support Contact</div>
        <div style={{ fontSize: 14, color: '#1E3A5F', lineHeight: 1.6 }}>
          <strong>[IT Contact Name/Email — to be filled in]</strong><br/>
          Responsible for: hosting and deployment issues, database/data integrity problems, email and messaging delivery failures, GPS/check-in system bugs, website outages, and any issue not resolved by the steps below. Contact for anything client-facing that is broken and cannot be fixed by refreshing, resending, or waiting.
        </div>
      </div>

      {/* TROUBLESHOOTING SOP */}
      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>IT Troubleshooting Guide</div>
      <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Common issues, what to check first, and when to escalate to IT.</div>

      {ISSUES.map((cat, i) => (
        <div key={i} style={{ marginBottom: 12, border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          <div
            onClick={() => setOpenCategory(openCategory === i ? null : i)}
            style={{ padding: '14px 18px', background: '#F9FAFB', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14, color: '#111827' }}
          >
            <span>{cat.category}</span>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>{openCategory === i ? '▲' : '▼'}</span>
          </div>
          {openCategory === i && (
            <div style={{ padding: '4px 18px 16px' }}>
              {cat.items.map((item, j) => (
                <div key={j} style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#B91C1C', marginBottom: 6 }}>⚠ {item.problem}</div>
                  <ol style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: 13.5, lineHeight: 1.8 }}>
                    {item.steps.map((s, k) => <li key={k}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
