import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { DARK_BG, CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'
import { LANGUAGES, getTranslator } from '../i18n'

export default function ClientOnboarding() {
  const [step, setStep] = useState('loading')
  const [invite, setInvite] = useState(null)
  const [form, setForm] = useState({ password: '', confirm: '', phone: '', smsConsent: false, termsAccepted: false })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [lang, setLang] = useState('en')

  const t = getTranslator(lang)
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
    if (form.password !== form.confirm) { setError(t('onboarding', 'errPasswordMismatch')); return }
    if (form.password.length < 8) { setError(t('onboarding', 'errPasswordLength')); return }
    if (form.phone && !form.smsConsent) { setError(t('onboarding', 'errSmsConsent')); return }
    if (!form.termsAccepted) { setError(t('onboarding', 'errWaiver')); return }
    setSubmitting(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.client_email,
      password: form.password
    })

    if (authError) { setError(authError.message); setSubmitting(false); return }

    const userId = authData.user?.id
    if (!userId) { setError(t('onboarding', 'errAccountFailed')); setSubmitting(false); return }

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      role: 'client',
      full_name: invite.client_name || invite.client_email
    })
    if (profileError) {
      setError(t('onboarding', 'errProfileFailed', profileError.message))
      setSubmitting(false)
      return
    }

    const { data: newClient, error: clientError } = await supabase.from('clients').insert({
      name: invite.client_name,
      email: invite.client_email,
      phone: form.phone || null,
      provider_id: invite.provider_id,
      auth_user_id: userId,
      preferred_language: lang,
      onboarding_complete: true,
      sms_consent_signed_at: (form.phone && form.smsConsent) ? new Date().toISOString() : null,
      terms_signed_at: new Date().toISOString()
    }).select().single()
    if (clientError || !newClient) {
      setError(t('onboarding', 'errClientFailed', clientError?.message || 'unknown error'))
      setSubmitting(false)
      return
    }

    // Complete the enrollment wizard end-to-end: if the provider linked this
    // invite to one of their real Programs, create the client_programs row
    // now so Journey tracking is live immediately, no manual follow-up step.
    let linkedProgram = null
    if (invite.program_id) {
      const { data } = await supabase.from('programs').select('duration_weeks').eq('id', invite.program_id).single()
      linkedProgram = data
    }
    await supabase.from('client_programs').insert({
      client_id: newClient.id,
      order_name: invite.program_type || 'Program',
      order_type: invite.enrollment_type || null,
      start_date: new Date().toISOString().split('T')[0],
      duration_weeks: linkedProgram?.duration_weeks ?? null,
      status: 'active',
      notes: invite.reporting_requirements || null,
    })

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

  const languagePicker = (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
      {Object.entries(LANGUAGES).map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          style={{
            padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: NAV_FONT,
            border: lang === code ? `1px solid ${ACCENT}` : `0.5px solid ${BORDER}`,
            background: lang === code ? 'rgba(91,155,240,0.15)' : 'transparent',
            color: lang === code ? ACCENT : TEXT_MUTED, fontWeight: lang === code ? 700 : 400,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )

  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG, fontFamily: NAV_FONT }}>
      <div style={{ color: TEXT_MUTED }}>{t('onboarding', 'verifying')}</div>
    </div>
  )

  if (step === 'invalid') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG, fontFamily: NAV_FONT, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{t('onboarding', 'invalidTitle')}</div>
        <div style={{ fontSize: 15, color: TEXT_MUTED }}>{t('onboarding', 'invalidBody')}</div>
      </div>
    </div>
  )

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG, fontFamily: NAV_FONT, padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{t('onboarding', 'successTitle')}</div>
        <div style={{ fontSize: 15, color: TEXT_MUTED, marginBottom: 24 }}>
          {t('onboarding', 'successBody', invite?.client_email)}
        </div>
        <div style={{ background: 'rgba(91,155,240,0.12)', borderRadius: 10, padding: 16, fontSize: 14, color: ACCENT }}>
          <strong>{t('onboarding', 'successNextLabel')}</strong> {t('onboarding', 'successNextBody')}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NAV_FONT, padding: 24 }}>
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, width: '100%', maxWidth: 440, overflow: 'hidden' }}>
        <div style={{ background: ACCENT, padding: '28px 32px 20px' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{t('onboarding', 'brand')}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>{t('onboarding', 'headerSubtitle')}</div>
        </div>
        <div style={{ padding: '24px 32px 32px' }}>
          {languagePicker}
          {invite?.client_name && (
            <div style={{ background: 'rgba(91,155,240,0.12)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: ACCENT }}>
              {t('onboarding', 'welcomePrefix')}<strong>{invite.client_name}</strong>
              {invite.program_type && <span> · {invite.program_type.replace(/_/g, ' ')}</span>}
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '14px 16px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t('onboarding', 'stepsTitle')}</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: TEXT, lineHeight: 1.9, textAlign: 'left' }}>
              <li>{t('onboarding', 'step1')}</li>
              <li>{t('onboarding', 'step2')}</li>
              <li>{t('onboarding', 'step3')}</li>
              <li>{t('onboarding', 'step4')}</li>
            </ol>
          </div>
          <div style={{ background: 'rgba(91,155,240,0.1)', border: `0.5px solid ${ACCENT}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: TEXT, lineHeight: 1.6, textAlign: 'left' }}>
            📍 <strong>{t('onboarding', 'locationTitle')}</strong> {t('onboarding', 'locationBody')}
          </div>
          <div style={{ background: 'rgba(248,113,113,0.1)', border: `0.5px solid ${RED}`, borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: TEXT, lineHeight: 1.6, textAlign: 'left' }}>
            🆘 <strong>{t('onboarding', 'urgentTitle')}</strong> {t('onboarding', 'urgentBody')}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t('onboarding', 'emailLabel')}</label>
              <input value={invite?.client_email || ''} disabled
                style={{ ...inputStyle, background: 'rgba(255,255,255,0.02)', color: TEXT_DIM }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t('onboarding', 'passwordLabel')}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8}
                placeholder={t('onboarding', 'passwordPlaceholder')}
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>{t('onboarding', 'confirmLabel')}</label>
              <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} required
                placeholder={t('onboarding', 'confirmPlaceholder')}
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('onboarding', 'legalReviewNote')}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t('onboarding', 'waiverTitle')}</div>
              <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 10, maxHeight: 140, overflowY: 'auto', background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 6, padding: 10 }}>
                {t('onboarding', 'waiverBody')}
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.termsAccepted} onChange={e => setForm(p => ({ ...p, termsAccepted: e.target.checked }))} style={{ marginTop: 2 }} required />
                {t('onboarding', 'waiverCheckbox')}
              </label>
            </div>
            <div style={{ marginBottom: form.phone ? 16 : 24 }}>
              <label style={labelStyle}>{t('onboarding', 'phoneLabel')}</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder={t('onboarding', 'phonePlaceholder')}
                style={inputStyle} />
            </div>
            {form.phone && (
              <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('onboarding', 'legalReviewNote')}</div>
                <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.6, marginBottom: 10 }}>
                  {t('onboarding', 'smsBody')}
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: TEXT, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.smsConsent} onChange={e => setForm(p => ({ ...p, smsConsent: e.target.checked }))} style={{ marginTop: 2 }} />
                  {t('onboarding', 'smsCheckbox')}
                </label>
              </div>
            )}
            {error && <div style={{ color: RED, fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: 14, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? t('onboarding', 'submittingButton') : t('onboarding', 'submitButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
