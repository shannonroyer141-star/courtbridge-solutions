import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { CARD_BG, ACCENT, GREEN, RED, WARNING, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'
import { PRICING, formatPrice, estimateMonthly } from '../pricing'

const STATUS_STYLE = {
  active: { color: GREEN, bg: 'rgba(76,175,125,0.15)', label: 'Active' },
  trialing: { color: ACCENT, bg: 'rgba(91,155,240,0.15)', label: 'Trialing' },
  past_due: { color: WARNING, bg: 'rgba(61,111,168,0.15)', label: 'Past Due' },
  canceled: { color: RED, bg: 'rgba(248,113,113,0.15)', label: 'Canceled' },
}

export default function Billing({ session }) {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState(null)
  const [activeClientCount, setActiveClientCount] = useState(0)

  async function fetchBilling() {
    setLoading(true)
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single()
    if (!profile?.organization_id) { setLoading(false); return }

    const { data: orgData } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single()
    setOrg(orgData)

    // Mirrors sync-client-billing's own counting logic: active clients across
    // every provider in this organization, not just the person viewing this page.
    const { data: orgProviders } = await supabase.from('profiles').select('id').eq('organization_id', profile.organization_id)
    const providerIds = (orgProviders || []).map(p => p.id)
    if (providerIds.length > 0) {
      const { count } = await supabase.from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .in('provider_id', providerIds)
      setActiveClientCount(count || 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchBilling() }, [])

  const row = (label, value, bold = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `0.5px solid ${BORDER}` }}>
      <span style={{ fontSize: 14, color: bold ? TEXT : TEXT_MUTED, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: 14, color: TEXT, fontWeight: bold ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )

  if (loading) {
    return <div style={{ fontFamily: NAV_FONT, color: TEXT_MUTED, fontSize: 14 }}>Loading...</div>
  }

  const onStripeBilling = !!org?.stripe_client_line_item_id
  const status = STATUS_STYLE[org?.subscription_status] || { color: TEXT_DIM, bg: 'rgba(255,255,255,0.06)', label: org?.subscription_status || 'Not set up' }
  const estimate = estimateMonthly(activeClientCount)

  return (
    <div style={{ fontFamily: NAV_FONT, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>Billing</div>
        <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 2 }}>Your subscription and current monthly estimate</div>
      </div>

      {!onStripeBilling ? (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 15, color: TEXT, marginBottom: 10 }}>
            Your organization isn't on self-serve billing yet.
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 16 }}>
            If you believe this is a mistake, or have questions about your plan, reach out and we'll sort it out directly.
          </div>
          <a href="mailto:info@courtbridgesolutions.com?subject=Billing%20Question" style={{ display: 'inline-block', padding: '9px 16px', background: ACCENT, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Contact Us About Billing
          </a>
        </div>
      ) : (
        <>
          <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Subscription Status</div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: status.bg, color: status.color }}>
                {status.label}
              </span>
            </div>
            {org?.subscription_status === 'past_due' && (
              <div style={{ background: 'rgba(61,111,168,0.1)', border: `0.5px solid ${WARNING}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: TEXT, marginBottom: 16 }}>
                Your last payment didn't go through. Update your payment method to avoid an interruption to your account.
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Billing Email</div>
            <div style={{ fontSize: 14, color: TEXT }}>{org?.billing_email || <span style={{ color: TEXT_DIM }}>Not set</span>}</div>
          </div>

          <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 16 }}>This Month's Estimate</div>
            {row('Platform fee', formatPrice(PRICING.flatMonthlyCents) + '/mo')}
            {row(`Active clients (${activeClientCount} × ${formatPrice(PRICING.perClientMonthlyCents)})`, formatPrice(PRICING.perClientMonthlyCents * activeClientCount) + '/mo')}
            <div style={{ paddingTop: 10 }}>
              {row('Estimated total', formatPrice(estimate) + '/mo', true)}
            </div>
            <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 12, lineHeight: 1.6 }}>
              This updates automatically as clients are added, reactivated, or deactivated. A change to your client count affects your next invoice, not the current one already in progress.
            </div>
          </div>

          <div style={{ fontSize: 13, color: TEXT_MUTED, textAlign: 'center' }}>
            To update your payment method or cancel your subscription, contact{' '}
            <a href="mailto:info@courtbridgesolutions.com?subject=Billing%20Change" style={{ color: ACCENT }}>info@courtbridgesolutions.com</a>.
          </div>
        </>
      )}
    </div>
  )
}
