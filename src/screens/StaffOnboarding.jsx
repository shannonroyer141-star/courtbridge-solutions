import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DARK_BG, CARD_BG, ACCENT, RED, GREEN, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'

const ORG_ROLE_LABELS = {
  admin: 'Admin', case_manager: 'Case Manager', front_desk: 'Front Desk / Intake', provider: 'Provider',
}

export default function StaffOnboarding() {
  const [step, setStep] = useState('loading')
  const [invite, setInvite] = useState(null)
  const [orgName, setOrgName] = useState('')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const token = new URLSearchParams(window.location.search).get('token')

  async function validateToken() {
    const { data, error } = await supabase
      .from('staff_invites')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) { setStep('invalid'); return }
    setInvite(data)
    const { data: org } = await supabase.from('organizations').select('organization_name').eq('id', data.organization_id).single()
    setOrgName(org?.organization_name || '')
    setStep('form')
  }

  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    validateToken()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password: form.password,
    })
    if (authError) { setError(authError.message); setSubmitting(false); return }

    const userId = authData.user?.id
    if (!userId) { setError('Could not create your account. Please try again.'); setSubmitting(false); return }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      role: 'provider',
      email: invite.email,
      full_name: invite.full_name || invite.email,
      organization_id: invite.organization_id,
      org_role: invite.org_role,
      is_org_admin: invite.is_org_admin,
      onboarding_complete: true,
      account_status: 'active',
    })
    if (profileError) { setError('Could not finish setting up your profile: ' + profileError.message); setSubmitting(false); return }

    await supabase.from('staff_invites').update({
      accepted: true,
      accepted_at: new Date().toISOString(),
    }).eq('token', token)

    setSubmitting(false)
    setStep('success')
  }

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }
  const inputStyle = { width: '100%', padding: '11px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, marginBottom: 14 }
  const btn = { width: '100%', padding: '13px 22px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: NAV_FONT }

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', fontFamily: NAV_FONT }}>
      <div style={{ color: TEXT, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>CourtBridge Solutions</div>
      <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 28 }}>Welcome to our new team member portal</div>

      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: '32px', width: '100%', maxWidth: 420 }}>
        {step === 'loading' && (
          <div style={{ color: TEXT_MUTED, textAlign: 'center' }}>Checking your invite...</div>
        )}

        {step === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8 }}>This invite link isn't valid</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
              It may have already been used or expired. Ask whoever invited you to send a fresh link.
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Welcome, {invite.full_name?.split(' ')[0] || 'there'}</div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.5 }}>
              You've been invited to join <strong>{orgName || 'your organization'}</strong> as {ORG_ROLE_LABELS[invite.org_role] || 'a team member'}. Set a password to finish creating your account.
            </div>

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: `0.5px solid ${RED}`, borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: RED }}>{error}</div>
            )}

            <label style={labelStyle}>Email</label>
            <div style={{ ...inputStyle, color: TEXT_DIM }}>{invite.email}</div>

            <label style={labelStyle}>Password</label>
            <input type="password" style={inputStyle} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 8 characters" required />

            <label style={labelStyle}>Confirm Password</label>
            <input type="password" style={inputStyle} value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Re-enter password" required />

            <button type="submit" style={{ ...btn, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'default' : 'pointer' }} disabled={submitting}>
              {submitting ? 'Creating your account...' : 'Create Account & Continue'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT, marginBottom: 8 }}>You're all set</div>
            <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.6 }}>
              Your account is ready. Log in to get started.
            </div>
            <button style={{ ...btn, background: GREEN }} onClick={() => { window.location.href = '/' }}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
