import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DARK_BG, CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'

const COMMON_PROGRAMS = [
  { program_name: 'Batterers Intervention Program (BIP)', program_type: 'BIP (Batterers Intervention)', duration_weeks: 26, frequency: 'Weekly' },
  { program_name: 'DUI/DWI Education Program', program_type: 'DUI', duration_weeks: 12, frequency: 'Weekly' },
  { program_name: 'Drug Court', program_type: 'Drug Court', duration_weeks: 52, frequency: 'Weekly + random testing' },
  { program_name: 'Mental Health Court', program_type: 'Mental Health Court', duration_weeks: 52, frequency: 'Biweekly' },
  { program_name: 'Anger Management', program_type: 'Anger Management', duration_weeks: 12, frequency: 'Weekly' },
  { program_name: 'Substance Abuse Treatment', program_type: 'Substance Abuse', duration_weeks: 16, frequency: 'Weekly' },
  { program_name: 'Probation Compliance Monitoring', program_type: 'Specialty Court', duration_weeks: null, frequency: 'Ongoing' },
]

export default function ProviderSetupWizard({ session, onDone }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [org, setOrg] = useState({ organization_name: '', contact_name: '', phone: '', address: '', city: '', state: '', zip: '', license_number: '', website: '' })
  const [selectedPrograms, setSelectedPrograms] = useState([])

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    if (data) {
      setOrg(prev => ({
        ...prev,
        organization_name: data.organization_name || '',
        contact_name: data.contact_name || session.user.email?.split('@')[0] || '',
        phone: data.phone || '',
        address: data.address || '', city: data.city || '', state: data.state || '', zip: data.zip || '',
        license_number: data.license_number || '', website: data.website || '',
      }))
    }
    setLoading(false)
  }

  function update(field, value) { setOrg(prev => ({ ...prev, [field]: value })); setError(null) }

  async function saveOrgAndContinue() {
    if (!org.organization_name.trim()) { setError('Organization name is required.'); return }
    if (!org.contact_name.trim()) { setError('Your name is required.'); return }
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('profiles').update(org).eq('id', session.user.id)
    setSaving(false)
    if (err) { setError('Could not save: ' + err.message); return }
    setStep(2)
  }

  function toggleProgram(name) {
    setSelectedPrograms(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  async function saveProgramsAndContinue() {
    setSaving(true)
    setError(null)
    if (selectedPrograms.length > 0) {
      const toInsert = COMMON_PROGRAMS
        .filter(p => selectedPrograms.includes(p.program_name))
        .map(p => ({ ...p, provider_id: session.user.id, allowed_radius_miles: 0.25 }))
      const { error: err } = await supabase.from('programs').insert(toInsert)
      if (err) { setError('Could not save programs: ' + err.message); setSaving(false); return }
    }
    setSaving(false)
    setStep(3)
  }

  async function finish(goToClients) {
    setSaving(true)
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', session.user.id)
    setSaving(false)
    onDone(goToClients)
  }

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }
  const inputStyle = { width: '100%', padding: '11px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, marginBottom: 14 }
  const btn = (bg = ACCENT, fg = '#fff', disabled = false) => ({ padding: '13px 22px', background: disabled ? 'rgba(255,255,255,0.08)' : bg, color: disabled ? TEXT_DIM : fg, border: bg === 'transparent' ? `0.5px solid ${BORDER}` : 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: NAV_FONT })
  const stepDot = (n) => (<div key={n} style={{ width: n === step ? 22 : 7, height: 7, borderRadius: 4, background: n <= step ? ACCENT : 'rgba(255,255,255,0.2)', transition: 'all 0.25s ease' }} />)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG }}>
      <div style={{ color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', fontFamily: NAV_FONT }}>
      <div style={{ color: TEXT, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>CourtBridge Solutions</div>
      <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 28 }}>Let's get your organization set up</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>{[1, 2, 3].map(stepDot)}</div>

      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: '32px', width: '100%', maxWidth: 480 }}>

        {step === 1 && (
          <>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Your organization</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.5 }}>This shows on court reports, certificates, and your Org Settings page. You can edit it anytime later.</div>
            <label style={labelStyle}>Organization Name *</label>
            <input style={inputStyle} value={org.organization_name} onChange={e => update('organization_name', e.target.value)} placeholder="Riverside Recovery Partners" />
            <label style={labelStyle}>Your Name *</label>
            <input style={inputStyle} value={org.contact_name} onChange={e => update('contact_name', e.target.value)} />
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} type="tel" value={org.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 000-0000" />
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>City</label>
                <input style={inputStyle} value={org.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div style={{ width: 90 }}>
                <label style={labelStyle}>State</label>
                <input style={inputStyle} value={org.state} onChange={e => update('state', e.target.value)} />
              </div>
            </div>
            <label style={labelStyle}>License Number (optional)</label>
            <input style={inputStyle} value={org.license_number} onChange={e => update('license_number', e.target.value)} />
            {error && <div style={{ color: RED, fontSize: 13, marginBottom: 14 }}>{error}</div>}
            <button style={{ ...btn(), width: '100%' }} disabled={saving} onClick={saveOrgAndContinue}>
              {saving ? 'Saving...' : 'Continue →'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Add your first program</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.5 }}>Pick the programs your agency runs. You can add more or edit these anytime under Programs.</div>
            {COMMON_PROGRAMS.map(p => (
              <label key={p.program_name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedPrograms.includes(p.program_name)} onChange={() => toggleProgram(p.program_name)} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{p.program_name}</div>
                  <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 2 }}>{p.duration_weeks ? `${p.duration_weeks} weeks • ` : ''}{p.frequency}</div>
                </div>
              </label>
            ))}
            {error && <div style={{ color: RED, fontSize: 13, margin: '14px 0 0' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button style={btn('transparent', TEXT_MUTED)} onClick={() => setStep(3)}>Skip</button>
              <button style={{ ...btn(), flex: 1 }} disabled={saving} onClick={saveProgramsAndContinue}>
                {saving ? 'Saving...' : selectedPrograms.length > 0 ? `Add ${selectedPrograms.length} & Continue →` : 'Continue →'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT, marginBottom: 8 }}>You're all set up</div>
            <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 26, lineHeight: 1.6 }}>
              Your organization is ready. Want to enroll your first client now, or explore the dashboard first?
            </div>
            <button style={{ ...btn(GREEN), width: '100%', marginBottom: 10 }} disabled={saving} onClick={() => finish(true)}>
              Enroll My First Client →
            </button>
            <button style={{ ...btn('transparent', TEXT_MUTED), width: '100%' }} disabled={saving} onClick={() => finish(false)}>
              I'll do this later — take me to my dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
