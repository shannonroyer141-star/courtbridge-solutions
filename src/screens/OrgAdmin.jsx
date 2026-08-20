import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'

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
  const [width, setWidth] = useState(window.innerWidth)
  const [editingItContact, setEditingItContact] = useState(false)
  const [itContactName, setItContactName] = useState('')
  const [itContactEmail, setItContactEmail] = useState('')
  const [savingItContact, setSavingItContact] = useState(false)
  const [itContactError, setItContactError] = useState(null)
  const [org, setOrg] = useState(null)
  const [brandColor, setBrandColor] = useState('#5B9BF0')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [brandingError, setBrandingError] = useState(null)
  const [brandingSaved, setBrandingSaved] = useState(false)

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isPhone = width < 640

  async function fetchProfile() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(data)
    setItContactName(data?.it_contact_name || '')
    setItContactEmail(data?.it_contact_email || '')
    if (data?.organization_id) {
      const { data: orgData } = await supabase.from('organizations').select('*').eq('id', data.organization_id).single()
      setOrg(orgData)
      if (orgData?.brand_color) setBrandColor(orgData.brand_color)
    }
    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [])

  async function uploadLogo(file) {
    if (!org?.id) return
    setUploadingLogo(true)
    setBrandingError(null)
    const ext = file.name.split('.').pop()
    const path = `${org.id}/logo.${ext}`
    const { error: uploadError } = await supabase.storage.from('org-branding').upload(path, file, { upsert: true })
    if (uploadError) { setBrandingError('Could not upload logo: ' + uploadError.message); setUploadingLogo(false); return }
    const { data: urlData } = supabase.storage.from('org-branding').getPublicUrl(path)
    const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`
    const { error: saveError } = await supabase.from('organizations').update({ logo_url: logoUrl }).eq('id', org.id)
    if (saveError) { setBrandingError('Logo uploaded but could not save: ' + saveError.message); setUploadingLogo(false); return }
    setOrg(prev => ({ ...prev, logo_url: logoUrl }))
    setUploadingLogo(false)
    setBrandingSaved(true)
    setTimeout(() => setBrandingSaved(false), 2500)
  }

  async function saveBrandColor() {
    if (!org?.id) return
    setBrandingError(null)
    const { error } = await supabase.from('organizations').update({ brand_color: brandColor }).eq('id', org.id)
    if (error) { setBrandingError('Could not save color: ' + error.message); return }
    setOrg(prev => ({ ...prev, brand_color: brandColor }))
    setBrandingSaved(true)
    setTimeout(() => setBrandingSaved(false), 2500)
  }

  async function saveItContact() {
    setSavingItContact(true)
    setItContactError(null)
    const { error } = await supabase.from('profiles').update({
      it_contact_name: itContactName,
      it_contact_email: itContactEmail,
    }).eq('id', session.user.id)
    if (!error) {
      setProfile(p => ({ ...p, it_contact_name: itContactName, it_contact_email: itContactEmail }))
      setEditingItContact(false)
    } else {
      setItContactError('Could not save: ' + error.message)
    }
    setSavingItContact(false)
  }

  const field = (label, value) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: TEXT }}>{value || <span style={{ color: TEXT_DIM }}>Not set</span>}</div>
    </div>
  )

  return (
    <div style={{ fontFamily: NAV_FONT, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>Org Settings</div>
        <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 2 }}>Organization profile and IT troubleshooting reference</div>
      </div>

      {/* ORGANIZATION PROFILE */}
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Organization Profile</div>
        {loading ? (
          <div style={{ color: TEXT_MUTED, fontSize: 14 }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 20 }}>
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
        <div style={{ marginTop: 8, fontSize: 12, color: TEXT_DIM }}>
          To update these details, contact IT or use Settings.
        </div>
      </div>

      {/* CUSTOM BRANDING */}
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Custom Branding</div>
        {!loading && !org?.branding_enabled ? (
          <>
            <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, marginTop: 8, marginBottom: 14 }}>
              Add your organization's own logo to Completion Certificates. This is a paid add-on to your plan.
            </p>
            <a href="mailto:info@courtbridgesolutions.com?subject=Add%20Custom%20Branding" style={{ display: 'inline-block', padding: '9px 16px', background: ACCENT, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Contact Us to Add Branding
            </a>
          </>
        ) : !loading && org?.branding_enabled ? (
          <>
            <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, marginTop: 8, marginBottom: 18 }}>
              Your logo appears on every Completion Certificate you issue.
            </p>
            {brandingError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{brandingError}</div>}
            {brandingSaved && <div style={{ color: GREEN, fontSize: 13, marginBottom: 12 }}>Saved.</div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ width: 72, height: 72, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {org.logo_url ? <img src={org.logo_url} alt="Your logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 11, color: TEXT_DIM }}>No logo</span>}
              </div>
              <div>
                <label style={{ display: 'inline-block', padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: TEXT, cursor: uploadingLogo ? 'default' : 'pointer' }}>
                  {uploadingLogo ? 'Uploading...' : (org.logo_url ? 'Replace Logo' : 'Upload Logo')}
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: 'none' }} disabled={uploadingLogo}
                    onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
                </label>
                <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 6 }}>PNG, JPG, or SVG — a transparent background works best.</div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Brand Color</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ width: 40, height: 32, padding: 0, border: `0.5px solid ${BORDER}`, borderRadius: 6, cursor: 'pointer', background: 'transparent' }} />
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>{brandColor}</span>
              <button onClick={saveBrandColor} style={{ padding: '7px 14px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save Color</button>
            </div>
          </>
        ) : null}
      </div>

      {/* DATA SECURITY & PRIVACY */}
      <div style={{ background: 'rgba(76,175,125,0.1)', border: `0.5px solid ${GREEN}`, borderRadius: 12, padding: '18px 24px', marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>🔒 Data Security &amp; Privacy</div>
        <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
          Every client's records (check-ins, messages, documents, notes) are access-controlled at the database level so that only that client and your organization can see them — not other providers, not other clients. CourtBridge Solutions does not sell or share client data with third parties. Location is only captured at the moments a client taps "Check In" or "Check Out" — this is not continuous background tracking.
          <br /><br />
          Client-facing questions or problems should always be directed to <strong>your organization</strong>, not to CourtBridge Solutions directly — clients are your clients.
        </div>
      </div>

      {/* VICTIM INFORMATION PROHIBITION */}
      <div style={{ background: 'rgba(248,113,113,0.08)', border: `0.5px solid ${RED}`, borderRadius: 12, padding: '18px 24px', marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Victim Information Prohibition</div>
        <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
          CourtBridge Solutions is a compliance and program-coordination platform for court-ordered program participants and authorized organizations. CourtBridge is not a victim-services system and does not create, maintain, or process victim profiles.
          <br /><br />
          Users must not enter, upload, transmit, or store information that identifies or could reasonably identify an alleged or confirmed victim or survivor.
          <br /><br />
          <strong>Prohibited information includes:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: 22 }}>
            <li>Names, initials, photographs, or identifying descriptions</li>
            <li>Home, work, school, shelter, or temporary addresses</li>
            <li>Telephone numbers, email addresses, or social-media information</li>
            <li>Current or historical location information</li>
            <li>Safety plans, protective measures, or shelter information</li>
            <li>Medical, counseling, or behavioral-health information</li>
            <li>Information concerning children or other protected household members</li>
            <li>Documents or narrative notes containing victim-identifying information</li>
          </ul>
          Participant records must be limited to the participant's program requirements, attendance, compliance, completion status, and other authorized administrative information.
          <br /><br />
          If victim-identifying information is submitted inadvertently, CourtBridge Solutions will restrict access to the information and follow its incident-review and secure-removal procedures, subject to applicable legal-preservation requirements. The submitting organization may be required to provide a properly redacted replacement.
        </div>
      </div>

      {/* IT CONTACT */}
      <div style={{ background: 'rgba(91,155,240,0.1)', border: `0.5px solid ${ACCENT}`, borderRadius: 12, padding: '18px 24px', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.04em' }}>IT / Technical Support Contact</div>
          {!editingItContact && (
            <button onClick={() => setEditingItContact(true)} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer', fontFamily: NAV_FONT }}>Edit</button>
          )}
        </div>
        {editingItContact ? (
          <div>
            <input value={itContactName} onChange={e => setItContactName(e.target.value)} placeholder="IT contact name"
              style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14 }} />
            <input type="email" value={itContactEmail} onChange={e => setItContactEmail(e.target.value)} placeholder="IT contact email"
              style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {itContactError && <div style={{ color: RED, fontSize: 13, marginBottom: 10 }}>{itContactError}</div>}
              <button onClick={saveItContact} disabled={savingItContact}
                style={{ padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: savingItContact ? 'not-allowed' : 'pointer' }}>
                {savingItContact ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditingItContact(false); setItContactName(profile?.it_contact_name || ''); setItContactEmail(profile?.it_contact_email || '') }}
                style={{ padding: '8px 16px', background: 'none', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6 }}>
            <strong>{profile?.it_contact_name || profile?.it_contact_email
              ? `${profile?.it_contact_name || ''}${profile?.it_contact_name && profile?.it_contact_email ? ' — ' : ''}${profile?.it_contact_email || ''}`
              : <span style={{ color: TEXT_DIM, fontWeight: 400 }}>No IT contact set — click Edit to add one.</span>}</strong><br/>
            Responsible for: hosting and deployment issues, database/data integrity problems, email and messaging delivery failures, GPS/check-in system bugs, website outages, and any issue not resolved by the steps below. Contact for anything client-facing that is broken and cannot be fixed by refreshing, resending, or waiting.
          </div>
        )}
      </div>

      {/* TROUBLESHOOTING SOP */}
      <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 }}>IT Troubleshooting Guide</div>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>Common issues, what to check first, and when to escalate to IT.</div>

      {ISSUES.map((cat, i) => (
        <div key={i} style={{ marginBottom: 12, border: `0.5px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
          <div
            onClick={() => setOpenCategory(openCategory === i ? null : i)}
            style={{ padding: '14px 18px', background: CARD_BG, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14, color: TEXT }}
          >
            <span>{cat.category}</span>
            <span style={{ color: TEXT_DIM, fontSize: 12 }}>{openCategory === i ? '▲' : '▼'}</span>
          </div>
          {openCategory === i && (
            <div style={{ padding: '4px 18px 16px', background: CARD_BG }}>
              {cat.items.map((item, j) => (
                <div key={j} style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: RED, marginBottom: 6 }}>⚠ {item.problem}</div>
                  <ol style={{ margin: 0, paddingLeft: 20, color: TEXT_MUTED, fontSize: 13.5, lineHeight: 1.8 }}>
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
