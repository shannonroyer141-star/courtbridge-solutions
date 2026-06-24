import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function CheckIn() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('getting');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setCheckInTime(new Date().toLocaleString());
    getLocation();
    fetchHistory();
  }, []);

  function getLocation() {
    setGpsStatus('getting');
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setAddress('GPS not supported on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLocation({ lat, lng });
        setGpsStatus('got');
        setAddress(`${lat}, ${lng}`);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          if (data?.display_name) setAddress(data.display_name);
        } catch {
          // keep lat/lng as fallback
        }
      },
      (err) => {
        setGpsStatus('denied');
        setAddress('Location unavailable — please allow location access');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function fetchHistory() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('client_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(5);
    if (data) setHistory(data);
  }

  async function handleCheckIn() {
    if (gpsStatus === 'getting') { setStatus('Still getting your location, try again in a moment.'); return; }
    if (gpsStatus === 'denied') { setStatus('Please allow location access in your browser and try again.'); return; }
    setSaving(true);
    setStatus('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('checkins').insert([{
      client_id: user.id,
      checked_in_at: new Date().toISOString(),
      latitude: location?.lat || null,
      longitude: location?.lng || null,
    }]);
    setSaving(false);
    if (error) {
      setStatus('Error: ' + error.message);
    } else {
      setStatus('success');
      setCheckInTime(new Date().toLocaleString());
      fetchHistory();
    }
  }

  const gpsColor = gpsStatus === 'got' ? '#16a34a' : gpsStatus === 'denied' ? '#dc2626' : '#F39C12';
  const gpsIcon = gpsStatus === 'got' ? '📍' : gpsStatus === 'denied' ? '⚠️' : '⏳';

  return (
    <div style={{ padding: '24px', maxWidth: '600px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '6px', fontSize: '24px' }}>Check-In</h1>
      <p style={{ color: '#8A9BB0', fontSize: '14px', marginBottom: '24px' }}>Your location and time are recorded automatically.</p>

      {status === 'success' ? (
        <div style={{ background: 'linear-gradient(135deg, #f0faf4, #e8f8ef)', border: '1.5px solid #27AE60', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <div style={{ fontWeight: '700', color: '#1a7a44', fontSize: '20px', marginBottom: '4px' }}>Check-in saved!</div>
          <div style={{ color: '#5a9a72', fontSize: '14px', marginBottom: '20px' }}>{checkInTime}</div>
          <button onClick={() => setStatus('')} style={{ background: '#27AE60', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Check In Again
          </button>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', marginBottom: '16px' }}>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-In Time</label>
            <div style={{ padding: '12px 14px', background: '#F8F9FB', borderRadius: '10px', color: '#2C3E50', fontSize: '15px', fontWeight: '500' }}>
              {checkInTime || 'Loading...'}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</label>
            <div style={{ padding: '12px 14px', background: '#F8F9FB', borderRadius: '10px', fontSize: '13px', color: '#2C3E50', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{gpsIcon}</span>
              <span style={{ color: gpsStatus === 'denied' ? '#dc2626' : '#2C3E50', lineHeight: 1.5 }}>
                {address || 'Getting your location...'}
              </span>
            </div>
            {gpsStatus === 'denied' && (
              <button onClick={getLocation} style={{ marginTop: '8px', background: 'none', border: '1px solid #1B3A6B', color: '#1B3A6B', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
                Try Again
              </button>
            )}
          </div>

          <button
            onClick={handleCheckIn}
            disabled={saving}
            style={{ width: '100%', padding: '16px', background: saving ? '#aaa' : 'linear-gradient(135deg, #16a34a, #0f7a2e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>📍</span> {saving ? 'Saving...' : 'Check In Now'}
          </button>

          {status && status !== 'success' && (
            <p style={{ marginTop: '12px', textAlign: 'center', color: '#dc2626', fontSize: '13px' }}>{status}</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ color: '#1B3A6B', marginBottom: '12px', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Check-Ins</h3>
          {history.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < history.length - 1 ? '1px solid #F0F2F5' : 'none' }}>
              <div style={{ fontSize: '13px', color: '#2C3E50', fontWeight: '500' }}>
                {new Date(h.checked_in_at || h.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '12px', color: '#27AE60', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27AE60', display: 'inline-block' }} />
                Present
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}