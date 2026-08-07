import { useState } from 'react'
import { CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'
import { NotesWarning } from '../components/VictimInfoWarning'
import { PROGRAM_TYPES, ENROLLMENT_TYPES, PHASES, emptyEnrollmentForm, validateParticipantInfo, validateProgramRequirements, smsTextFor, createEnrollmentInvite } from '../enrollment'

export default function ClientIntake({ session }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [generatedLink, setGeneratedLink] = useState(null)

  const [form, setForm] = useState(emptyEnrollmentForm())

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); setError(null) }

  async function handleSend() {
    setLoading(true); setError(null)
    const { link, error: inviteError } = await createEnrollmentInvite(session.user.id, form)
    if (inviteError) {
      setError('Failed to save intake. Please try again. ' + inviteError.message)
    } else {
      setGeneratedLink(link)
      setStep(4)
    }
    setLoading(false)
  }

  function copyLink() { navigator.clipboard.writeText(generatedLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500) }

  function copySmsText() {
    navigator.clipboard.writeText(smsTextFor(form, generatedLink))
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500)
  }

  function startAnother() {
    setForm(emptyEnrollmentForm())
    setGeneratedLink(null); setStep(1)
  }

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }
  const inp = { width: '100%', padding: '11px 13px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 14, marginBottom: 14, boxSizing: 'border-box', outline: 'none', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }
  const ta = { ...inp, minHeight: 80, resize: 'vertical' }
  const sel = { ...inp, background: CARD_BG, cursor: 'pointer' }
  const btn = (bg = ACCENT, fg = '#fff', disabled = false) => ({ padding: '12px 20px', background: disabled ? 'rgba(255,255,255,0.08)' : bg, color: disabled ? TEXT_DIM : fg, border: bg === 'transparent' ? `0.5px solid ${ACCENT}` : 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' })
  const stepBadge = (n, active) => (<div key={n} style={{ width: 28, height: 28, borderRadius: '50%', background: active ? ACCENT : 'rgba(255,255,255,0.08)', color: active ? '#fff' : TEXT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{n}</div>)
  const reviewRow = (l, val) => val ? (<div key={l} style={{ marginBottom: 12 }}><div style={{ ...lbl, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14, color: TEXT }}>{val}</div></div>) : null

  return (
    <div style={{ padding: 30, maxWidth: 640, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Client Intake</h1>
        {step < 4 && <div style={{ display: 'flex', gap: 8 }}>{[1, 2, 3].map(n => stepBadge(n, n <= step))}</div>}
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>
        Collects everything needed to get a new participant onboarded onto the app. Once submitted, they'll get a secure link to finish creating their own account.
      </p>

      {step === 1 && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
          <label style={lbl}>Full Legal Name *</label>
          <input style={inp} value={form.client_name} onChange={e => update('client_name', e.target.value)} placeholder="As it appears on legal documents" />
          <label style={lbl}>Email Address *</label>
          <input style={inp} type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} placeholder="Participant's email address" />
          <label style={lbl}>Cell Phone Number *</label>
          <input style={inp} type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(000) 000-0000" />
          <label style={lbl}>Date of Birth *</label>
          <input style={inp} type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} />
          {error && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button style={btn()} onClick={() => { const err = validateParticipantInfo(form); if (err) { setError(err); return } setError(null); setStep(2) }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
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
          <NotesWarning />
          <textarea style={ta} value={form.reporting_requirements} onChange={e => update('reporting_requirements', e.target.value)} placeholder="e.g. Attend group sessions 3 times per week." />
          <label style={lbl}>Check-In Schedule *</label>
          <textarea style={{ ...ta, minHeight: 60 }} value={form.checkin_schedule} onChange={e => update('checkin_schedule', e.target.value)} placeholder="e.g. Check in daily by 10:00 AM." />
          {error && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
            <button style={btn('transparent', ACCENT)} onClick={() => { setError(null); setStep(1) }}>← Back</button>
            <button style={btn()} onClick={() => { const err = validateProgramRequirements(form); if (err) { setError(err); return } setError(null); setStep(3) }}>Review →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 12, textTransform: 'uppercase' }}>Participant</div>
            {reviewRow('Full Name', form.client_name)}
            {reviewRow('Email', form.client_email)}
            {reviewRow('Phone', form.phone)}
            {reviewRow('Date of Birth', form.date_of_birth ? new Date(form.date_of_birth + 'T00:00:00').toLocaleDateString() : null)}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 12, textTransform: 'uppercase' }}>Program</div>
            {reviewRow('Program Type', form.program_type)}
            {reviewRow('Case Number', form.case_number)}
            {reviewRow('Reporting Requirements', form.reporting_requirements)}
            {reviewRow('Check-In Schedule', form.checkin_schedule)}
          </div>
          {error && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 10 }}>
            <button style={btn('transparent', ACCENT)} onClick={() => { setError(null); setStep(2) }}>← Back</button>
            <button style={btn(ACCENT, '#fff', loading)} onClick={!loading ? handleSend : undefined}>{loading ? 'Saving...' : 'Complete Intake →'}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Intake complete for {form.client_name}</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>Send them this link to finish setting up their own account. It expires in 48 hours.</div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, wordBreak: 'break-all', fontSize: 12, textAlign: 'left', color: TEXT }}>{generatedLink}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={btn()} onClick={copySmsText}>{linkCopied ? '✓ Copied to Clipboard' : 'Copy Full Text Message'}</button>
            <button style={btn('transparent', ACCENT)} onClick={copyLink}>Copy Link Only</button>
            <button style={btn('rgba(255,255,255,0.04)', TEXT_MUTED)} onClick={startAnother}>Start Another Intake</button>
          </div>
        </div>
      )}
    </div>
  )
}
