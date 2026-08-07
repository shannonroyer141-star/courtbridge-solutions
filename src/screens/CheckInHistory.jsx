import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'
import { logLocationAccess } from '../lib/locationAccessLog'

export default function CheckInHistory({ session }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [width, setWidth] = useState(window.innerWidth)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => { fetchCheckins() }, [])

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isPhone = width < 640

  async function fetchCheckins() {
    setLoading(true)
    setLoadError(null)

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('provider_id', session.user.id)

    if (clientsError) { setLoadError(clientsError.message); setCheckins([]); setLoading(false); return }
    if (!clients || clients.length === 0) { setCheckins([]); setLoading(false); return }

    const clientMap = {}
    clients.forEach(c => { clientMap[c.id] = c.name })
    const clientIds = clients.map(c => c.id)

    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .in('client_id', clientIds)
      .order('checked_in_at', { ascending: false })
      .limit(200)

    if (error) { setLoadError(error.message); setLoading(false); return }
    setCheckins(data.map(c => ({ ...c, client_name: clientMap[c.client_id] || 'Unknown Client' })))
    setLoading(false)
  }

  const filtered = checkins.filter(c =>
    c.client_name.toLowerCase().includes(search.toLowerCase())
  )

  function formatTime(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div style={{ fontFamily: NAV_FONT, maxWidth: 900, margin: '0 auto', padding: isPhone ? 14 : 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXT }}>Check-In Log</div>
          <div style={{ fontSize: 14, color: TEXT_MUTED, marginTop: 2 }}>GPS-verified check-ins from your clients</div>
        </div>
        <button onClick={fetchCheckins} style={{ padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by client name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 14, marginBottom: 20, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }}
      />

      {loading && <div style={{ color: TEXT_MUTED, fontSize: 15 }}>Loading check-ins...</div>}

      {!loading && loadError && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: `0.5px solid ${RED}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: RED, marginBottom: 16 }}>
          Couldn't load check-ins: {loadError}. Click Refresh to try again.
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: TEXT }}>No check-ins yet</div>
          <div style={{ fontSize: 14, color: TEXT_DIM, marginTop: 4 }}>Client check-ins will appear here once they start using the app</div>
        </div>
      )}

      {!loading && filtered.length > 0 && isPhone && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontWeight: 600, color: TEXT, marginBottom: 4 }}>{c.client_name}</div>
              <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 4 }}>{formatTime(c.checked_in_at)}</div>
              <div style={{ marginBottom: 4 }}>
                {c.latitude && c.longitude ? (
                  <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer" onClick={() => logLocationAccess('viewed_coordinate_link', { clientId: c.client_id })} style={{ color: ACCENT, textDecoration: 'none', fontSize: 13 }}>
                    View on map
                  </a>
                ) : (
                  <span style={{ color: TEXT_DIM, fontSize: 13 }}>No location</span>
                )}
              </div>
              {c.notes && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>{c.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && !isPhone && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 2fr', gap: 12, padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: `0.5px solid ${BORDER}`, fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <div>Client</div>
            <div>Date &amp; Time</div>
            <div>Location</div>
            <div>Notes</div>
          </div>
          {filtered.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 2fr', gap: 12, padding: '14px 20px', borderBottom: `0.5px solid ${BORDER}`, fontSize: 14, alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: TEXT }}>{c.client_name}</div>
              <div style={{ color: TEXT_MUTED }}>{formatTime(c.checked_in_at)}</div>
              <div>
                {c.latitude && c.longitude ? (
                  <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer" onClick={() => logLocationAccess('viewed_coordinate_link', { clientId: c.client_id })} style={{ color: ACCENT, textDecoration: 'none', fontSize: 13 }}>
                    View on map
                  </a>
                ) : (
                  <span style={{ color: TEXT_DIM, fontSize: 13 }}>No location</span>
                )}
              </div>
              <div style={{ color: TEXT_MUTED, fontSize: 13 }}>{c.notes || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
