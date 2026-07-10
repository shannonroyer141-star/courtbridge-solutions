import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function CheckInHistory({ session }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchCheckins() }, [])

  async function fetchCheckins() {
    setLoading(true)

    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .eq('provider_id', session.user.id)

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

    if (!error && data) {
      setCheckins(data.map(c => ({ ...c, client_name: clientMap[c.client_id] || 'Unknown Client' })))
    }
    setLoading(false)
  }

  const BLUE = '#1B3A6B'

  const filtered = checkins.filter(c =>
    c.client_name.toLowerCase().includes(search.toLowerCase())
  )

  function formatTime(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: BLUE }}>Check-In Log</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>GPS-verified check-ins from your clients</div>
        </div>
        <button onClick={fetchCheckins} style={{ padding: '8px 16px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by client name..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
      />

      {loading && <div style={{ color: '#6B7280', fontSize: 15 }}>Loading check-ins...</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>No check-ins yet</div>
          <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>Client check-ins will appear here once they start using the app</div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 2fr', gap: 12, padding: '12px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <div>Client</div>
            <div>Date &amp; Time</div>
            <div>Location</div>
            <div>Notes</div>
          </div>
          {filtered.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 2fr', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F3F4F6', fontSize: 14, alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: '#111827' }}>{c.client_name}</div>
              <div style={{ color: '#374151' }}>{formatTime(c.checked_in_at)}</div>
              <div>
                {c.latitude && c.longitude ? (
                  <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer" style={{ color: BLUE, textDecoration: 'none', fontSize: 13 }}>
                    View on map
                  </a>
                ) : (
                  <span style={{ color: '#9CA3AF', fontSize: 13 }}>No location</span>
                )}
              </div>
              <div style={{ color: '#6B7280', fontSize: 13 }}>{c.notes || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
