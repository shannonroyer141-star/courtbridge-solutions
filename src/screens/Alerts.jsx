import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Alerts({ session }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAlerts() }, [])

  async function fetchAlerts() {
    setLoading(true)
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, program_type, check_in_frequency_days')
      .eq('provider_id', session.user.id)
      .eq('status', 'active')

    if (!clients || clients.length === 0) { setAlerts([]); setLoading(false); return }

    const missed = []
    for (const client of clients) {
      const freqDays = client.check_in_frequency_days || 1
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - freqDays)

      const { data: recentCheckin } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .eq('client_id', client.id)
        .gte('checked_in_at', cutoff.toISOString())
        .order('checked_in_at', { ascending: false })
        .limit(1)

      if (!recentCheckin || recentCheckin.length === 0) {
        const { data: lastCheckin } = await supabase
          .from('check_ins')
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

  const BLUE = '#1B3A6B'

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>Missed Check-In Alerts</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>Participants who have not checked in on schedule</div>
        </div>
        <button onClick={fetchAlerts} style={{ padding: '8px 16px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {loading && <div style={{ color: '#6B7280', fontSize: 15 }}>Loading alerts...</div>}

      {!loading && alerts.length === 0 && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#166534' }}>All participants are current</div>
          <div style={{ fontSize: 14, color: '#4ADE80', marginTop: 4 }}>No missed check-ins to report</div>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div>
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#92400E' }}>
            ⚠ {alerts.length} participant{alerts.length !== 1 ? 's have' : ' has'} missed a scheduled check-in
          </div>
          {alerts.map(({ client, lastCheckin, daysMissed }) => (
            <div key={client.id} style={{ background: '#fff', border: '1px solid #FCA5A5', borderLeft: '4px solid #EF4444', borderRadius: 10, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{client.name}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{client.program_type || 'Program not set'}</div>
                </div>
                <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                  MISSED
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: '#6B7280' }}>
                {lastCheckin
                  ? <>Last check-in: <strong>{new Date(lastCheckin).toLocaleDateString([], { dateStyle: 'medium' })}</strong> · {daysMissed} day{daysMissed !== 1 ? 's' : ''} ago</>
                  : 'No check-ins on record'}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#6B7280' }}>
                Required every <strong>{client.check_in_frequency_days || 1} day{(client.check_in_frequency_days || 1) !== 1 ? 's' : ''}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}