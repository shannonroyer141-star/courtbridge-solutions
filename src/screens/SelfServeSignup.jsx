import { useState } from 'react'
import { DARK_BG, CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'
import { PRICING, formatPrice, estimateMonthly } from '../pricing'

const SUPABASE_URL = 'https://howvgvrrxcpdiqjbnhzn.supabase.co'
const SAMPLE_CLIENT_COUNTS = [1, 10, 25, 50]

export default function SelfServeSignup() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ org_name: '', admin_name: '', admin_email: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); setError(null) }

  function validateStep1() {
    if (!form.org_name.trim()) return 'Organization name is required.'
    if (!form.admin_name.trim()) return 'Your name is required.'
    if (!form.admin_email.trim() || !form.admin_email.includes('@')) return 'A valid email is required.'
    return null
  }

  async function handleContinue() {
    const err = validateStep1()
    if (err) { setError(err); return }
    setStep(2)
  }

  async function handleCheckout() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not start checkout. Please try again.')
      window.location.href = data.url
    } catch (e) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  const inputStyle = { width: '100%', padding: '11px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, marginBottom: 14 }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', fontFamily: NAV_FONT }}>
      <div style={{ color: TEXT, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>CourtBridge Solutions</div>
      <div style={{ color: TEXT_MUTED, fontSize: 14, marginBottom: 36 }}>Start your agency's account</div>

      {step === 1 && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: '32px', width: '100%', maxWidth: 440 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 20 }}>Tell us about your agency</div>
          <label style={labelStyle}>Organization Name</label>
          <input value={form.org_name} onChange={e => update('org_name', e.target.value)} placeholder="Riverside Recovery Partners" style={inputStyle} />
          <label style={labelStyle}>Your Name</label>
          <input value={form.admin_name} onChange={e => update('admin_name', e.target.value)} placeholder="Jane Smith" style={inputStyle} />
          <label style={labelStyle}>Your Email</label>
          <input type="email" value={form.admin_email} onChange={e => update('admin_email', e.target.value)} placeholder="jane@example.com" style={inputStyle} />
          <label style={labelStyle}>Phone (optional)</label>
          <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 000-0000" style={inputStyle} />
          {error && <div style={{ color: RED, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button onClick={handleContinue} style={{ width: '100%', padding: 14, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ width: '100%', maxWidth: 520 }}>
          <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: '28px 26px', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 4 }}>One simple price</div>
            <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 20 }}>A flat platform fee, plus a per-client rate. No tiers, no caps — it scales with your caseload automatically.</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: TEXT }}>{formatPrice(PRICING.flatMonthlyCents)}</span>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>/mo flat</span>
              <span style={{ fontSize: 16, color: TEXT_DIM, margin: '0 2px' }}>+</span>
              <span style={{ fontSize: 34, fontWeight: 700, color: TEXT }}>{formatPrice(PRICING.perClientMonthlyCents)}</span>
              <span style={{ fontSize: 13, color: TEXT_MUTED }}>/active client</span>
            </div>
            <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 20 }}>Billed monthly. Cancel anytime.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
              {['Check-ins, alerts, and messaging', 'Compliance reports and audit tools', 'Cross-agency referrals and directory access', 'Everything on the platform — no feature gating by plan'].map((f, i) => (
                <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'flex', gap: 8 }}>
                  <span style={{ color: GREEN }}>✓</span>{f}
                </div>
              ))}
            </div>

            <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>What that looks like</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {SAMPLE_CLIENT_COUNTS.map(n => (
                  <div key={n} style={{ flex: '1 1 100px', background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 3 }}>{n} client{n !== 1 ? 's' : ''}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{formatPrice(estimateMonthly(n))}<span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 400 }}>/mo</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <div style={{ color: RED, fontSize: 13, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
          <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={{ padding: '13px 18px', background: 'transparent', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
              Back
            </button>
            <button onClick={handleCheckout} disabled={submitting} style={{ flex: 1, padding: 14, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Starting checkout...' : `Continue to Payment →`}
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: TEXT_DIM, marginTop: 14 }}>
            You'll enter payment details on Stripe's secure checkout page. Cancel anytime.
          </div>
        </div>
      )}
    </div>
  )
}
