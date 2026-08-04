import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme'

export default function Alerts({ session }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => { fetchAlerts() }, [])

  async function fetchAlerts() {
    setLoading(true)
    setLoadError(null)
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, population_type, check_in_frequency_days')
      .eq('provider_id', session.user.id)
      .eq('status', 'active')

    if (error) { setLoadError(error.message); setAlerts([]); setLoading(false); return }
    if (!clients || clients.length === 0) { setAlerts([]); setLoading(false); return }

    const missed = []
    for (const client of clients) {
      const freqDays = client.check_in_frequency_days || 1
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - freqDays)

      const { data: recentCheckin } = await supabase
        .from('checkins')
        .select('checked_in_at')
        .eq('client_id', client.id)
        .gte('checked_in_at', cutoff.toISOString())
        .order('checked_in_at', { ascending: false })
        .limit(1)

      if (!recentCheckin || recentCheckin.length === 0) {
        const { data: lastCheckin } = await supabase
          .from('checkins')
          .select('checked_in_at')
          .eq('client_id', client.id)
          .order('checked_in_at', { ascending: false })
          .limit(1)

        missed.push({
          client,
          lastCheckin: lastCheckin?.[0]?.checked_in_at || null,
          daysMissed: lastCheckin?.[0]
            ? Math.floor((new Date() - new Date(lastCheckin[0].checked_in_at)) / 86400000)
            : null
        })
      }
    }
    setAlerts(missed)
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: NAV_FONT, maxWidth: 700, margin: '0 auto', padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>Missed Check-In Alerts</div>
          <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 2 }}>Participants who have not checked in on schedule</div>
        </div>
        <button onClick={fetchAlerts} style={{ padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {loading && <div style={{ color: TEXT_MUTED, fontSize: 15 }}>Loading alerts...</div>}

      {!loading && loadError && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: `0.5px solid ${RED}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: RED }}>
          Couldn't load alerts: {loadError}. Click Refresh to try again — this list may not reflect who's actually missed a check-in right now.
        </div>
      )}

      {!loading && !loadError && alerts.length === 0 && (
        <div style={{ background: 'rgba(76,175,125,0.1)', border: `0.5px solid ${GREEN}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: GREEN }}>All participants are current</div>
          <div style={{ fontSize: 14, color: GREEN, marginTop: 4 }}>No missed check-ins to report</div>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div>
          <div style={{ background: 'rgba(61,111,168,0.12)', border: `0.5px solid ${WARNING}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: WARNING }}>
            ⚠ {alerts.length} participant{alerts.length !== 1 ? 's have' : ' has'} missed a scheduled check-in
          </div>
          {alerts.map(({ client, lastCheckin, daysMissed }) => (
            <div key={client.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderLeft: `4px solid ${RED}`, borderRadius: 10, padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{client.name}</div>
                  <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>{client.population_type || 'Program not set'}</div>
                </div>
                <div style={{ background: 'rgba(248,113,113,0.15)', color: RED, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                  MISSED
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: TEXT_MUTED }}>
                {lastCheckin
                  ? <>Last check-in: <strong>{new Date(lastCheckin).toLocaleDateString([], { dateStyle: 'medium' })}</strong> · {daysMissed} day{daysMissed !== 1 ? 's' : ''} ago</>
                  : 'No check-ins on record'}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: TEXT_MUTED }}>
                Required every <strong>{client.check_in_frequency_days || 1} day{(client.check_in_frequency_days || 1) !== 1 ? 's' : ''}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
