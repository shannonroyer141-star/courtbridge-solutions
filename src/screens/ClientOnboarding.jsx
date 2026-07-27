import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DARK_BG, CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'

export default function ClientOnboarding() {
  const [step, setStep] = useState('loading')
  const [invite, setInvite] = useState(null)
  const [form, setForm] = useState({ password: '', confirm: '', phone: '', smsConsent: false, termsAccepted: false })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    validateToken()
  }, [])

  async function validateToken() {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) { setStep('invalid'); return }
    setInvite(data)
    setStep('form')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.phone && !form.smsConsent) { setError('Please agree to receive text messages, or leave the phone number blank.'); return }
    if (!form.termsAccepted) { setError('Please review and agree to the program waiver to continue.'); return }
    setSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.client_email,
      password: form.password
    })

    if (authError) { setError(authError.message); setSubmitting(false); return }

    const userId = authData.user?.id
    if (!userId) { setError('Account creation failed. Please try again.'); setSubmitting(false); return }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      role: 'client',
      full_name: invite.client_name || invite.client_email
    })
    if (profileError) {
      setError('Something went wrong finishing your account setup. Please contact your provider — your login was created but needs to be linked. (' + profileError.message + ')')
      setSubmitting(false)
      return
    }

    const { data: newClient, error: clientError } = await supabase.from('clients').insert({
      name: invite.client_name,
      email: invite.client_email,
      phone: form.phone || null,
      provider_id: invite.provider_id,
      auth_user_id: userId,
      onboarding_complete: true,
      sms_consent_signed_at: (form.phone && form.smsConsent) ? new Date().toISOString() : null,
      terms_signed_at: new Date().toISOString()
    }).select().single()
    if (clientError || !newClient) {
      setError('Something went wrong creating your client record. Please contact your provider before trying again. (' + (clientError?.message || 'unknown error') + ')')
      setSubmitting(false)
      return
    }

    await supabase.from('invites').update({
      accepted: true,
      accepted_at: new Date().toISOString(),
      client_id: newClient.id
    }).eq('token', token)

    setSubmitting(false)
    setStep('success')
  }

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }
  const inputStyle = { width: '100%', padding: '11px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }

  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG, fontFamily: NAV_FONT }}>
      <div style={{ color: TEXT_MUTED }}>Verifying your enrollment link...</div>
    </div>
  )

  if (step === 'invalid') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG, fontFamily: NAV_FONT, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Invalid or Expired Link</div>
        <div style={{ fontSize: 15, color: TEXT_MUTED }}>This enrollment link is invalid or has already been used. Please contact your program coordinator for a new link.</div>
      </div>
    </div>
  )

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG, fontFamily: NAV_FONT, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 8 }}>You're enrolled!</div>
        <div style={{ fontSize: 15, color: TEXT_MUTED, marginBottom: 24 }}>
          Check your email ({invite?.client_email}) for a confirmation link, then log in to CourtBridge.
        </div>
        <div style={{ background: 'rgba(91,155,240,0.12)', borderRadius: 10, padding: 16, fontSize: 14, color: ACCENT }}>
          <strong>Next step:</strong> Open your email, click the confirmation link, then return here to log in.
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NAV_FONT, padding: 24 }}>
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
        <div style={{ background: ACCENT, padding: '28px 32px 20px' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>CourtBridge Solutions</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>Complete Your Enrollment</div>
        </div>
        <div style={{ padding: '24px 32px 32px' }}>
          {invite?.client_name && (
            <div style={{ background: 'rgba(91,155,240,0.12)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: ACCENT }}>
              Welcome, <strong>{invite.client_name}</strong>
              {invite.program_type && <span> · {invite.program_type.replace(/_/g, ' ')}</span>}
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>To finish setting up your account</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: TEXT, lineHeight: 1.9, textAlign: 'left' }}>
              <li>Create a password (at least 8 characters)</li>
              <li>Add your phone number if you'd like text alerts (optional)</li>
              <li>Read and agree to the program waiver</li>
              <li>Submit to complete your enrollment</li>
            </ol>
          </div>
          <div style={{ background: 'rgba(91,155,240,0.1)', border: `0.5px solid ${ACCENT}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: TEXT, lineHeight: 1.6, textAlign: 'left' }}>
            📍 <strong>About your location:</strong> this app is not a continuous tracking system — it does not run in the background or follow you around. It only captures your location in the brief moments you tap "Check In" or "Check Out," so your provider can confirm your visit happened where and for how long it was supposed to.
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input value={invite?.client_email || ''} disabled
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: TEXT_DIM }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Create Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8}
                placeholder="Minimum 8 characters"
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required
                placeholder="Re-enter password"
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>⚠ Placeholder — needs legal review before use</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Program Waiver &amp; Consent</div>
              <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 10, maxHeight: 140, overflowY: 'auto', background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 6, padding: 10 }}>
                By enrolling, you acknowledge that your participation in this program is subject to the terms set by your referring court, probation officer, or agency. You understand that your check-ins, location data, and compliance record are recorded and may be shared with your provider, probation officer, or the court as required. This program does not provide legal advice. You agree to comply with your program's requirements and to communicate promptly with your provider about any issues affecting your participation.
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.termsAccepted} onChange={e => setForm(p => ({ ...p, termsAccepted: e.target.checked }))} style={{ marginTop: 2 }} required />
                I have read and agree to the program waiver above.
              </label>
            </div>
            <div style={{ marginBottom: form.phone ? 16 : 24 }}>
              <label style={labelStyle}>Phone Number (optional)</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="(555) 000-0000"
                style={inputStyle} />
            </div>
            {form.phone && (
              <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>⚠ Placeholder — needs legal review before use</div>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 10 }}>
                  By checking this box, you agree that CourtBridge Solutions and your provider may send you text messages, including urgent compliance-related alerts, at the phone number above. Message and data rates may apply. You can withdraw consent at any time by contacting your provider.
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.smsConsent} onChange={e => setForm(p => ({ ...p, smsConsent: e.target.checked }))} style={{ marginTop: 2 }} />
                  I agree to receive text messages at the number above.
                </label>
              </div>
            )}
            {error && <div style={{ color: RED, fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: 14, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Creating account...' : 'Complete Enrollment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
