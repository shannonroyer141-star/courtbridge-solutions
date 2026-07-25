import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ClientOnboarding() {
  const [step, setStep] = useState('loading')
  const [invite, setInvite] = useState(null)
  const [form, setForm] = useState({ password: '', confirm: '', phone: '', smsConsent: false })
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
    setSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.client_email,
      password: form.password
    })

    if (authError) { setError(authError.message); setSubmitting(false); return }

    const userId = authData.user?.id
    if (!userId) {
      setError('This email may already have an account. Try logging in at the main page instead, or contact your coordinator for a new enrollment link.')
      setSubmitting(false)
      return
    }

    await supabase.from('profiles').insert({
      id: userId,
      role: 'client',
      full_name: invite.client_name || invite.client_email
    })

    const { data: newClient } = await supabase.from('clients').insert({
      name: invite.client_name,
      email: invite.client_email,
      phone: form.phone || null,
      provider_id: invite.provider_id,
      auth_user_id: userId,
      onboarding_complete: true,
      sms_consent_signed_at: (form.phone && form.smsConsent) ? new Date().toISOString() : null
    }).select().single()

    await supabase.from('invites').update({
      accepted: true,
      accepted_at: new Date().toISOString(),
      client_id: newClient?.id || null
    }).eq('token', token)

    setSubmitting(false)
    setStep('success')
  }

  const BLUE = '#1B3A6B'

  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6F8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ color: BLUE }}>Verifying your enrollment link...</div>
    </div>
  )

  if (step === 'invalid') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6F8', fontFamily: 'Arial, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Invalid or Expired Link</div>
        <div style={{ fontSize: 15, color: '#6B7280' }}>This enrollment link is invalid or has already been used. Please contact your program coordinator for a new link.</div>
      </div>
    </div>
  )

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6F8', fontFamily: 'Arial, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>You're enrolled!</div>
        <div style={{ fontSize: 15, color: '#6B7280', marginBottom: 24 }}>
          Check your email ({invite?.client_email}) for a confirmation link, then log in to CourtBridge.
        </div>
        <div style={{ background: '#EFF6FF', borderRadius: 10, padding: 16, fontSize: 14, color: BLUE }}>
          <strong>Next step:</strong> Open your email, click the confirmation link, then return here to log in.
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ background: BLUE, padding: '28px 32px 20px' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>CourtBridge Solutions</div>
          <div style={{ color: '#A8C4E0', fontSize: 13, marginTop: 4 }}>Complete Your Enrollment</div>
        </div>
        <div style={{ padding: '24px 32px 32px' }}>
          {invite?.client_name && (
            <div style={{ background: '#F0F9FF', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 14, color: BLUE }}>
              Welcome, <strong>{invite.client_name}</strong>
              {invite.program_type && <span> · {invite.program_type.replace(/_/g, ' ')}</span>}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</label>
              <input value={invite?.client_email || ''} disabled
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 15, background: '#F9FAFB', color: '#6B7280', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Create Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8}
                placeholder="Minimum 8 characters"
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required
                placeholder="Re-enter password"
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: form.phone ? 16 : 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Phone Number (optional)</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="(555) 000-0000"
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' }} />
            </div>
            {form.phone && (
              <div style={{ marginBottom: 24, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>⚠ Placeholder — needs legal review before use</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 10 }}>
                  By checking this box, you agree that CourtBridge Solutions and your provider may send you text messages, including urgent compliance-related alerts, at the phone number above. Message and data rates may apply. You can withdraw consent at any time by contacting your provider.
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#111827', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.smsConsent} onChange={e => setForm(p => ({ ...p, smsConsent: e.target.checked }))} style={{ marginTop: 2 }} />
                  I agree to receive text messages at the number above.
                </label>
              </div>
            )}
            {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: 14, background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Creating account...' : 'Complete Enrollment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
