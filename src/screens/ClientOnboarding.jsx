import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const BLUE = '#1B3A6B'

export default function ClientOnboarding() {
  const [step, setStep] = useState(0)
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [gpsScrolled, setGpsScrolled] = useState(false)
  const [termsScrolled, setTermsScrolled] = useState(false)
  const [sigName, setSigName] = useState('')
  const [termsSigName, setTermsSigName] = useState('')

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (!token) { setStep(99); setError('This link is invalid or missing. Please contact your program provider.'); return }
    loadInvite()
  }, [token])

  async function loadInvite() {
    const { data, error } = await supabase.from('invites').select('*').eq('token', token).single()
    if (error || !data) { setStep(99); setError('This enrollment link could not be found. Please contact your program provider.'); return }
    if (data.accepted) { setStep(99); setError('This enrollment link has already been used. If you need help logging in, contact your program provider.'); return }
    if (new Date(data.expires_at) < new Date()) { setStep(99); setError('This enrollment link has expired. Please contact your program provider for a new link.'); return }
    setInvite(data)
    setStep(1)
  }

  async function handleCreateAccount() {
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setError(null)
    setStep(4)
  }

  async function handleGpsConsent() {
    if (!sigName.trim()) { setError('Please type your full name to sign.'); return }
    setError(null)
    setStep(5)
  }

  async function handleTermsConsent() {
    if (!termsSigName.trim()) { setError('Please type your full name to sign.'); return }
    setError(null)
    setLoading(true)
    try {
      const now = new Date().toISOString()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invite.client_email,
        password,
        options: { data: { full_name: invite.client_name, role: 'client' } }
      })
      if (authError) throw authError
      const userId = authData.user.id

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId, email: invite.client_email, full_name: invite.client_name,
        phone: invite.phone, role: 'client', onboarding_complete: true, intake_complete: true
      })
      if (profileError) throw profileError

      const { data: clientData, error: clientError } = await supabase.from('clients').insert({
        name: invite.client_name, email: invite.client_email, phone: invite.phone,
        provider_id: invite.provider_id, population_type: invite.program_type || 'standard',
        date_of_birth: invite.date_of_birth, case_number: invite.case_number,
        enrollment_type: invite.enrollment_type || 'court_ordered',
        reporting_requirements: invite.reporting_requirements,
        checkin_schedule: invite.checkin_schedule,
        program_phase: invite.program_phase || 'Phase 1',
        onboarding_complete: true, onboarding_completed_at: now,
        gps_consent_signed_at: now, terms_signed_at: now, status: 'active'
      }).select().single()
      if (clientError) throw clientError

      await supabase.from('legal_agreements').insert({ user_id: userId, agreement_type: 'client_consent', agreed: true, agreed_at: now, signer_name: sigName })
      await supabase.from('legal_agreements').insert({ user_id: userId, agreement_type: 'terms_conditions', agreed: true, agreed_at: now, signer_name: termsSigName })
      await supabase.from('invites').update({ accepted: true, accepted_at: now, client_id: clientData.id }).eq('token', token)
      await supabase.from('alerts').insert({
        client_id: clientData.id, provider_id: invite.provider_id, alert_type: 'other',
        message: `${invite.client_name} has completed enrollment and is now active on the platform.`, resolved: false
      })

      setStep(6)
    } catch (err) {
      setError('Something went wrong during enrollment. Please try again or contact your provider. Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function enrollmentLabel(type) {
    return { court_ordered: 'Court-Ordered', probation_referred: 'Probation Referred', voluntary: 'Voluntary Enrollment', no_document: 'Provider Directed' }[type] || type
  }

  const page = { minHeight: '100vh', background: '#F5F6F8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Arial, sans-serif' }
  const card = { background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 480, width: '100%', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }
  const header = { background: BLUE, borderRadius: '12px 12px 0 0', padding: '20px 28px', maxWidth: 480, width: '100%', textAlign: 'center' }
  const label = { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }
  const value = { fontSize: 15, color: '#1a1a2e', marginBottom: 16 }
  const input = { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }
  const btn = { width: '100%', padding: '14px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }
  const scrollBox = { border: '1px solid #ddd', borderRadius: 8, padding: '16px', height: 200, overflowY: 'auto', fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 16, background: '#fafafa' }
  const infoRow = (lbl, val) => (
    <div key={lbl} style={{ marginBottom: 16 }}>
      <span style={label}>{lbl}</span>
      <div style={value}>{val || '—'}</div>
    </div>
  )

  if (step === 0) return <div style={page}><div style={{ color: BLUE, fontSize: 16 }}>Loading your enrollment...</div></div>

  if (step === 99) return (
    <div style={page}>
      <div style={header}><div style={{ color: '#A8C4E0', fontSize: 13, marginBottom: 4 }}>CourtBridge Solutions</div><div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Enrollment Error</div></div>
      <div style={{ ...card, borderRadius: '0 0 16px 16px' }}>
        <div style={{ color: '#cc0000', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>{error}</div>
        <div style={{ fontSize: 13, color: '#888' }}>If you believe this is a mistake, contact your program provider directly.</div>
      </div>
    </div>
  )

  if (step === 6) return (
    <div style={page}>
      <div style={header}><div style={{ color: '#A8C4E0', fontSize: 13, marginBottom: 4 }}>CourtBridge Solutions</div><div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>You're Enrolled</div></div>
      <div style={{ ...card, borderRadius: '0 0 16px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: BLUE, marginBottom: 12 }}>Enrollment Complete</div>
        <div style={{ fontSize: 15, color: '#444', lineHeight: 1.7, marginBottom: 24 }}>Welcome to the program, <strong>{invite?.client_name}</strong>. Your provider has been notified that you are active.</div>
        <div style={{ background: '#F0F4FA', borderRadius: 8, padding: '16px', textAlign: 'left', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: BLUE, marginBottom: 8 }}>Your next steps:</div>
          <div style={{ fontSize: 13, color: '#444', lineHeight: 1.8 }}>
            • Check your email — you may need to confirm your account<br />
            • Log in to the platform to complete your first check-in<br />
            • Your check-in schedule: <strong>{invite?.checkin_schedule || 'As directed by your provider'}</strong>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>Your GPS consent and program acknowledgment have been recorded and timestamped.</div>
      </div>
    </div>
  )

  if (step === 1) return (
    <div style={page}>
      <div style={header}>
        <div style={{ color: '#A8C4E0', fontSize: 13, marginBottom: 4 }}>CourtBridge Solutions</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Program Enrollment</div>
        <div style={{ color: '#C8D8EE', fontSize: 13, marginTop: 4 }}>Complete your enrollment to get started</div>
      </div>
      <div style={{ ...card, borderRadius: '0 0 16px 16px' }}>
        <div style={{ fontSize: 15, color: '#333', lineHeight: 1.7, marginBottom: 24 }}>You have been enrolled in a program through <strong>CourtBridge Solutions</strong>. This will take about 3 minutes.</div>
        <div style={{ background: '#F0F4FA', borderRadius: 8, padding: '16px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 600 }}>You will:</div>
          {['Review your program requirements', 'Create your account', 'Sign your GPS monitoring consent', 'Acknowledge your program terms'].map((item, i) => (
            <div key={i} style={{ fontSize: 13, color: '#444', marginBottom: 4, display: 'flex', gap: 8 }}>
              <span style={{ color: BLUE, fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 20, lineHeight: 1.6 }}>Your enrollment information was entered by your program provider based on your program requirements. You will be asked to confirm this information.</div>
        <button style={btn} onClick={() => setStep(2)}>Begin Enrollment →</button>
      </div>
    </div>
  )

  if (step === 2) return (
    <div style={page}>
      <div style={header}><div style={{ color: '#A8C4E0', fontSize: 13, marginBottom: 4 }}>Step 1 of 4</div><div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Review Your Program Information</div></div>
      <div style={{ ...card, borderRadius: '0 0 16px 16px' }}>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>This information was entered by your provider based on your program requirements. Review it carefully. If anything is incorrect, contact your provider before continuing.</div>
        <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
          {infoRow('Full Name', invite.client_name)}
          {infoRow('Date of Birth', invite.date_of_birth ? new Date(invite.date_of_birth + 'T00:00:00').toLocaleDateString() : null)}
          {infoRow('Phone Number', invite.phone)}
          {infoRow('Program Type', invite.program_type)}
          {infoRow('Enrollment Type', enrollmentLabel(invite.enrollment_type))}
          {invite.case_number && infoRow('Case Number', invite.case_number)}
          {infoRow('Program Phase', invite.program_phase || 'Phase 1')}
          {infoRow('Program Reporting Requirements', invite.reporting_requirements)}
          {infoRow('Check-In Schedule', invite.checkin_schedule)}
        </div>
        <div style={{ background: '#FFF8E1', border: '1px solid #F0C040', borderRadius: 8, padding: 12, fontSize: 12, color: '#7A5C00', marginBottom: 20, lineHeight: 1.6 }}>⚠ If any of this information is incorrect, do not continue. Contact your program provider immediately.</div>
        {error && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button style={btn} onClick={() => { setError(null); setStep(3) }}>This information is correct →</button>
        <button style={{ ...btn, background: 'transparent', color: BLUE, border: `1px solid ${BLUE}`, marginTop: 8 }} onClick={() => setStep(1)}>← Back</button>
      </div>
    </div>
  )

  if (step === 3) return (
    <div style={page}>
      <div style={header}><div style={{ color: '#A8C4E0', fontSize: 13, marginBottom: 4 }}>Step 2 of 4</div><div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Create Your Account</div></div>
      <div style={{ ...card, borderRadius: '0 0 16px 16px' }}>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>Create a password to access your program portal. You will use your email and this password to log in.</div>
        <span style={label}>Your Login Email</span>
        <div style={{ ...value, background: '#F5F6F8', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{invite.client_email}</div>
        <span style={label}>Create Password</span>
        <input type="password" placeholder="Minimum 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={input} />
        <span style={label}>Confirm Password</span>
        <input type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={input} />
        <div style={{ fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>Choose a password you will remember. Do not share it with anyone including your provider.</div>
        {error && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button style={btn} onClick={handleCreateAccount}>Continue →</button>
        <button style={{ ...btn, background: 'transparent', color: BLUE, border: `1px solid ${BLUE}`, marginTop: 8 }} onClick={() => { setError(null); setStep(2) }}>← Back</button>
      </div>
    </div>
  )

  if (step === 4) return (
    <div style={page}>
      <div style={header}><div style={{ color: '#A8C4E0', fontSize: 13, marginBottom: 4 }}>Step 3 of 4</div><div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>GPS Monitoring Consent</div></div>
      <div style={{ ...card, borderRadius: '0 0 16px 16px' }}>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>Read the following consent carefully before signing. You must scroll through the full document before you can sign.</div>
        <div style={scrollBox} onScroll={e => { const el = e.target; if (el.scrollHeight - el.scrollTop <= el.clientHeight + 10) setGpsScrolled(true) }}>
          <strong>GPS MONITORING CONSENT AND ACKNOWLEDGMENT</strong><br /><br />
          I, the undersigned participant, hereby acknowledge and consent to the following as a condition of my enrollment in {invite.program_type || 'my court-ordered program'} through the CourtBridge Solutions platform:<br /><br />
          <strong>1. Location Monitoring</strong><br />I understand and agree that my geographic location will be verified through GPS technology each time I complete a required check-in on the CourtBridge Solutions platform. My device's location services must be enabled for check-ins to be recorded.<br /><br />
          <strong>2. Data Recorded</strong><br />I understand that each check-in will record my GPS coordinates, the date and time of check-in, and the device used. This information is timestamped and stored securely.<br /><br />
          <strong>3. Who Can See This Information</strong><br />I understand that my check-in location data may be accessible to: (a) my program provider and their authorized staff; and (b) court coordinators or supervising officers as required by my program conditions or court order.<br /><br />
          <strong>4. Purpose</strong><br />I understand that GPS monitoring is used solely to verify my compliance with my program reporting requirements. It is not used to track my movements outside of required check-in times.<br /><br />
          <strong>5. Consent is Required</strong><br />I understand that GPS monitoring consent is a required condition of my participation in this program. Refusing consent will result in my inability to complete check-ins through the platform, which may be reported to the court as non-compliance.<br /><br />
          <strong>6. Voluntary Acknowledgment</strong><br />By signing below, I confirm that I have read and understand this consent, that I am signing voluntarily, and that I have had the opportunity to ask my provider any questions about this consent prior to signing.
        </div>
        {!gpsScrolled && <div style={{ fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'center' }}>↓ Scroll to the bottom to enable signing</div>}
        {gpsScrolled && (
          <>
            <span style={label}>Type Your Full Legal Name to Sign</span>
            <input type="text" placeholder="Full legal name" value={sigName} onChange={e => setSigName(e.target.value)} style={input} />
            <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Signed electronically on {new Date().toLocaleDateString()} — this constitutes a legal signature.</div>
          </>
        )}
        {error && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button style={{ ...btn, opacity: gpsScrolled && sigName.trim() ? 1 : 0.4, cursor: gpsScrolled && sigName.trim() ? 'pointer' : 'not-allowed' }} onClick={gpsScrolled && sigName.trim() ? handleGpsConsent : undefined}>I Consent — Continue →</button>
        <button style={{ ...btn, background: 'transparent', color: BLUE, border: `1px solid ${BLUE}`, marginTop: 8 }} onClick={() => { setError(null); setStep(3) }}>← Back</button>
      </div>
    </div>
  )

  if (step === 5) return (
    <div style={page}>
      <div style={header}><div style={{ color: '#A8C4E0', fontSize: 13, marginBottom: 4 }}>Step 4 of 4</div><div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Program Acknowledgment</div></div>
      <div style={{ ...card, borderRadius: '0 0 16px 16px' }}>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>Read and acknowledge your program requirements. Scroll through the full document to sign.</div>
        <div style={scrollBox} onScroll={e => { const el = e.target; if (el.scrollHeight - el.scrollTop <= el.clientHeight + 10) setTermsScrolled(true) }}>
          <strong>PROGRAM PARTICIPATION ACKNOWLEDGMENT</strong><br /><br />
          I, the undersigned, acknowledge that I have been enrolled in <strong>{invite.program_type || 'a court-ordered program'}</strong> and confirm my understanding of the following:<br /><br />
          <strong>My Program Requirements</strong><br />{invite.reporting_requirements || 'As directed by my program provider and court order.'}<br /><br />
          <strong>My Check-In Schedule</strong><br />{invite.checkin_schedule || 'As directed by my program provider.'}<br /><br />
          <strong>My Current Phase</strong><br />{invite.program_phase || 'Phase 1'}<br /><br />
          <strong>1. Platform Use</strong><br />I understand that I am required to use the CourtBridge Solutions platform to complete my program check-ins. Failure to check in as required will be recorded as non-compliance and may be reported to my supervising officer, probation officer, or the court.<br /><br />
          <strong>2. Accurate Check-Ins</strong><br />I understand that I must only check in from my actual location and may not attempt to falsify, manipulate, or circumvent GPS verification. Falsifying a check-in is a violation of my program conditions and may result in sanctions, program termination, or legal consequences.<br /><br />
          <strong>3. My Own Device</strong><br />I agree to access the platform only from my own personal device. I will not allow others to check in on my behalf.<br /><br />
          <strong>4. Reporting Changes</strong><br />I agree to notify my program provider promptly if my phone number changes so that my account can be updated. I understand that failing to do so may result in missed notifications and recorded non-compliance.<br /><br />
          <strong>5. Consequences of Non-Compliance</strong><br />I understand that missed check-ins, falsified locations, or failure to meet my program reporting requirements will be documented in the platform and may be reported to the court. I understand that non-compliance may result in sanctions, program termination, or other legal consequences as determined by the court.<br /><br />
          <strong>6. Acknowledgment</strong><br />By signing below, I confirm that I have read and understand my program requirements and participation terms, that I have had the opportunity to ask questions, and that I am entering into this acknowledgment voluntarily.
        </div>
        {!termsScrolled && <div style={{ fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'center' }}>↓ Scroll to the bottom to enable signing</div>}
        {termsScrolled && (
          <>
            <span style={label}>Type Your Full Legal Name to Sign</span>
            <input type="text" placeholder="Full legal name" value={termsSigName} onChange={e => setTermsSigName(e.target.value)} style={input} />
            <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Signed electronically on {new Date().toLocaleDateString()} — this constitutes a legal signature.</div>
          </>
        )}
        {error && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button style={{ ...btn, opacity: termsScrolled && termsSigName.trim() && !loading ? 1 : 0.4, cursor: termsScrolled && termsSigName.trim() && !loading ? 'pointer' : 'not-allowed' }} onClick={termsScrolled && termsSigName.trim() && !loading ? handleTermsConsent : undefined}>
          {loading ? 'Completing Enrollment...' : 'I Acknowledge — Complete Enrollment →'}
        </button>
        <button style={{ ...btn, background: 'transparent', color: BLUE, border: `1px solid ${BLUE}`, marginTop: 8 }} onClick={() => { setError(null); setStep(4) }} disabled={loading}>← Back</button>
      </div>
    </div>
  )

  return null
}