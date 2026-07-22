import { useState } from 'react'
import { supabase } from '../supabase'

const BLUE = '#1B3A6B'

const PROGRAM_TYPES = [
  'Drug Court', 'DUI / Alcohol Court', 'Mental Health Court',
  'Veterans Treatment Court', 'Batterers Intervention Program (BIP)',
  'Anger Management', 'Recovery Court', 'Family Treatment Court', 'Probation', 'Other'
]

const ENROLLMENT_TYPES = [
  { value: 'court_ordered', label: 'Court-Ordered — I have a court order' },
  { value: 'probation_referred', label: 'Probation Referred — referred by probation officer' },
  { value: 'voluntary', label: 'Voluntary — participant chose this program' },
  { value: 'no_document', label: 'No Document Yet — paperwork pending' }
]

const PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4']

export default function ClientIntake({ session }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatedLink, setGeneratedLink] = useState(null)

  const [form, setForm] = useState({
    client_name: '', client_email: '', phone: '', date_of_birth: '',
    program_type: '', enrollment_type: 'court_ordered', case_number: '',
    program_phase: 'Phase 1', reporting_requirements: '', checkin_schedule: '', message: ''
  })

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); setError(null) }

  function validateStep1() {
    if (!form.client_name.trim()) return 'Full name is required.'
    if (!form.client_email.trim() || !form.client_email.includes('@')) return 'A valid email is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (!form.date_of_birth) return 'Date of birth is required.'
    return null
  }

  function validateStep2() {
    if (!form.program_type) return 'Program type is required.'
    if (!form.reporting_requirements.trim()) return 'Program reporting requirements are required.'
    if (!form.checkin_schedule.trim()) return 'Check-in schedule is required.'
    return null
  }

  async function handleSend() {
    setLoading(true); setError(null)
    try {
      const { data, error: inviteError } = await supabase.from('invites').insert({
        provider_id: session.user.id,
        client_name: form.client_name, client_email: form.client_email,
        phone: form.phone, date_of_birth: form.date_of_birth,
        program_type: form.program_type, enrollment_type: form.enrollment_type,
        case_number: form.case_number || null, program_phase: form.program_phase,
        reporting_requirements: form.reporting_requirements,
        checkin_schedule: form.checkin_schedule, message: form.message || null,
        accepted: false, expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }).select().single()
      if (inviteError) throw inviteError
      setGeneratedLink(`${window.location.origin}/enroll?token=${data.token}`)
      setStep(4)
    } catch (err) {
      setError('Failed to save intake. Please try again. ' + err.message)
    } finally { setLoading(false) }
  }

  function copyLink() { navigator.clipboard.writeText(generatedLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500) }

  function copySmsText() {
    navigator.clipboard.writeText(`You have been enrolled in ${form.program_type} through CourtBridge Solutions. Click the link below to complete your enrollment within 48 hours. This is required. ${generatedLink}`)
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500)
  }

  function startAnother() {
    setForm({ client_name: '', client_email: '', phone: '', date_of_birth: '', program_type: '', enrollment_type: 'court_ordered', case_number: '', program_phase: 'Phase 1', reporting_requirements: '', checkin_schedule: '', message: '' })
    setGeneratedLink(null); setStep(1)
  }

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }
  const inp = { width: '100%', padding: '11px 13px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 14, boxSizing: 'border-box', outline: 'none' }
  const ta = { ...inp, minHeight: 80, resize: 'vertical' }
  const sel = { ...inp, background: '#fff', cursor: 'pointer' }
  const btn = (bg = BLUE, fg = '#fff', disabled = false) => ({ padding: '12px 20px', background: disabled ? '#ccc' : bg, color: fg, border: bg === 'transparent' ? `1px solid ${BLUE}` : 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' })
  const stepBadge = (n, active) => (<div key={n} style={{ width: 28, height: 28, borderRadius: '50%', background: active ? BLUE : '#E5E7EB', color: active ? '#fff' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{n}</div>)
  const reviewRow = (l, val) => val ? (<div key={l} style={{ marginBottom: 12 }}><div style={{ ...lbl, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14, color: '#222' }}>{val}</div></div>) : null

  return (
    <div style={{ padding: '30px', maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ color: BLUE, margin: 0 }}>Client Intake</h1>
        {step < 4 && <div style={{ display: 'flex', gap: 8 }}>{[1, 2, 3].map(n => stepBadge(n, n <= step))}</div>}
      </div>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Collects everything needed to get a new participant onboarded onto the app. Once submitted, they'll get a secure link to finish creating their own account.
      </p>

      {step === 1 && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 12, padding: 24 }}>
          <label style={lbl}>Full Legal Name *</label>
          <input style={inp} value={form.client_name} onChange={e => update('client_name', e.target.value)} placeholder="As it appears on legal documents" />
          <label style={lbl}>Email Address *</label>
          <input style={inp} type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} placeholder="Participant's email address" />
          <label style={lbl}>Cell Phone Number *</label>
          <input style={inp} type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(000) 000-0000" />
          <label style={lbl}>Date of Birth *</label>
          <input style={inp} type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
          {error && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btn()} onClick={() => { const err = validateStep1(); if (err) { setError(err); return } setError(null); setStep(2) }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 12, padding: 24 }}>
          <label style={lbl}>Program Type *</label>
          <select style={sel} value={form.program_type} onChange={e => update('program_type', e.target.value)}>
            <option value="">Select program type...</option>
            {PROGRAM_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label style={lbl}>Enrollment Type *</label>
          <select style={sel} value={form.enrollment_type} onChange={e => update('enrollment_type', e.target.value)}>
            {ENROLLMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label style={lbl}>Case / Docket Number</label>
          <input style={inp} value={form.case_number} onChange={e => update('case_number', e.target.value)} placeholder="Leave blank if not applicable" />
          <label style={lbl}>Starting Phase</label>
          <select style={sel} value={form.program_phase} onChange={e => update('program_phase', e.target.value)}>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label style={lbl}>Program Reporting Requirements *</label>
          <textarea style={ta} value={form.reporting_requirements} onChange={e => update('reporting_requirements', e.target.value)} placeholder="e.g. Attend group sessions 3 times per week." />
          <label style={lbl}>Check-In Schedule *</label>
          <textarea style={{ ...ta, minHeight: 60 }} value={form.checkin_schedule} onChange={e => update('checkin_schedule', e.target.value)} placeholder="e.g. Check in daily by 10:00 AM." />
          {error && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button style={btn('transparent', BLUE)} onClick={() => { setError(null); setStep(1) }}>← Back</button>
            <button style={btn()} onClick={() => { const err = validateStep2(); if (err) { setError(err); return } setError(null); setStep(3) }}>Review →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 12, padding: 24 }}>
          <div style={{ background: '#F0F4FA', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, marginBottom: 12, textTransform: 'uppercase' }}>Participant</div>
            {reviewRow('Full Name', form.client_name)}
            {reviewRow('Email', form.client_email)}
            {reviewRow('Phone', form.phone)}
            {reviewRow('Date of Birth', form.date_of_birth ? new Date(form.date_of_birth + 'T00:00:00').toLocaleDateString() : null)}
          </div>
          <div style={{ background: '#F0F4FA', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: BLUE, marginBottom: 12, textTransform: 'uppercase' }}>Program</div>
            {reviewRow('Program Type', form.program_type)}
            {reviewRow('Case Number', form.case_number)}
            {reviewRow('Reporting Requirements', form.reporting_requirements)}
            {reviewRow('Check-In Schedule', form.checkin_schedule)}
          </div>
          {error && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <button style={btn('transparent', BLUE)} onClick={() => { setError(null); setStep(2) }}>← Back</button>
            <button style={btn(BLUE, '#fff', loading)} onClick={!loading ? handleSend : undefined}>{loading ? 'Saving...' : 'Complete Intake →'}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: BLUE, marginBottom: 8 }}>Intake complete for {form.client_name}</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Send them this link to finish setting up their own account. It expires in 48 hours.</div>
          <div style={{ background: '#F0F4FA', borderRadius: 8, padding: '12px 16px', marginBottom: 16, wordBreak: 'break-all', fontSize: 12, textAlign: 'left' }}>{generatedLink}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={btn()} onClick={copySmsText}>{linkCopied ? '✓ Copied to Clipboard' : 'Copy Full Text Message'}</button>
            <button style={btn('transparent', BLUE)} onClick={copyLink}>Copy Link Only</button>
            <button style={btn('#F5F6F8', '#333')} onClick={startAnother}>Start Another Intake</button>
          </div>
        </div>
      )}
    </div>
  )
}
