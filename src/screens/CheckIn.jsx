import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function CheckIn({ session, onBack }) {
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [timestamp, setTimestamp] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(true)
  const [clientId, setClientId] = useState(null)
  const [clientLookupError, setClientLookupError] = useState(null)

  useEffect(() => {
    const now = new Date()
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    setTimestamp(local.toISOString().slice(0, 16))

    supabase
      .from('clients')
      .select('id')
      .or(`auth_user_id.eq.${session.user.id},email.eq.${session.user.email}`)
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setClientId(data[0].id)
        else setClientLookupError('No client record found for this account.')
      })

    if (!navigator.geolocation) {
      setLocationError('GPS not available on this device.')
      setGpsLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        })
        setGpsLoading(false)
      },
      () => {
        setLocationError('Could not get location. Please enable GPS and try again.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  function retryGPS() {
    setGpsLoading(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) })
        setGpsLoading(false)
      },
      () => { setLocationError('Still unable to get location.'); setGpsLoading(false) },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!location) { alert('Location is required. Please enable GPS.'); return }
    if (!clientId) { alert(clientLookupError || 'Client record not loaded yet. Please try again.'); return }
    setSubmitting(true)
    const { error } = await supabase.from('checkins').insert({
      client_id: clientId,
      checked_in_at: new Date(timestamp).toISOString(),
      latitude: location.lat,
      longitude: location.lng,
      gps_accuracy_meters: location.accuracy,
      notes: notes || null
    })
    setSubmitting(false)
    if (error) alert('Check-in failed: ' + error.message)
    else setSubmitted(true)
  }

  const SLATE = '#1E2A3A'
  const s = { page: { minHeight: '100vh', background: SLATE, fontFamily: 'Arial, sans-serif', padding: 24 }, card: { background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid rgba(255,255,255,0.08)' }, label: { display: 'block', fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }, input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 15, color: '#fff', boxSizing: 'border-box', colorScheme: 'dark' } }

  if (submitted) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Checked In</div>
        <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8 }}>
          {new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
        {location && <div style={{ fontSize: 12, color: '#64748B', marginBottom: 32 }}>📍 ±{location.accuracy}m accuracy</div>}
        <button onClick={onBack} style={{ padding: '14px 32px', background: '#fff', color: SLATE, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 14, cursor: 'pointer', marginBottom: 24 }}>← Back</button>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Check In</div>
        <div style={{ color: '#64748B', fontSize: 14, marginBottom: 28 }}>Your location and time are recorded automatically.</div>

        <div style={s.card}>
          <div style={s.label}>GPS Location</div>
          {gpsLoading && <div style={{ color: '#94A3B8', fontSize: 14 }}>⟳ Acquiring location...</div>}
          {!gpsLoading && location && (
            <div>
              <div style={{ color: '#4CAF7D', fontSize: 14, fontWeight: 600 }}>✓ Location captured</div>
              <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)} · ±{location.accuracy}m
              </div>
            </div>
          )}
          {!gpsLoading && locationError && (
            <div>
              <div style={{ color: '#F87171', fontSize: 14, marginBottom: 8 }}>⚠ {locationError}</div>
              <button onClick={retryGPS} style={{ fontSize: 13, color: '#94A3B8', background: 'none', border: '1px solid #334155', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}>
                Try Again
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Date & Time</label>
            <input type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} required style={s.input} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={s.label}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Anything to add..." style={{ ...s.input, resize: 'vertical' }} />
          </div>
          <button type="submit" disabled={submitting || gpsLoading}
            style={{ width: '100%', padding: 16, background: gpsLoading ? '#334155' : '#5B9BF0', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: submitting || gpsLoading ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Submitting...' : gpsLoading ? 'Waiting for GPS...' : 'Submit Check-In'}
          </button>
        </form>
      </div>
    </div>
  )
}