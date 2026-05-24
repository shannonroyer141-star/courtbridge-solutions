import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function CheckIn() {
  const [location, setLocation] = useState(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setCheckInTime(new Date().toLocaleString());
    getLocation();
    fetchHistory();
  }, []);

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setStatus('Could not get location. Please allow location access.')
      );
    }
  }

  async function fetchHistory() {
    const { data } = await supabase.from('Check_ins').select('*').order('created_at', { ascending: false }).limit(5);
    if (data) setHistory(data);
  }

  async function handleCheckIn() {
    if (!location) { setStatus('Waiting for GPS location...'); return; }
    setSaving(true);
    const { error } = await supabase.from('Check_ins').insert([{
      latitude: location.lat,
      longitude: location.lng,
      check_in_time: new Date().toISOString(),
    }]);
    setSaving(false);
    if (error) setStatus('Error: ' + error.message);
    else { setStatus('Check-in saved!'); fetchHistory(); }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '600px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '30px' }}>Check-In</h1>
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontWeight: 'bold', color: '#555' }}>Check-In Time</label>
          <div style={{ padding: '12px', background: '#f4f6f9', borderRadius: '8px', marginTop: '5px' }}>{checkInTime}</div>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold', color: '#555' }}>Location (GPS)</label>
          <div style={{ padding: '12px', background: '#f4f6f9', borderRadius: '8px', marginTop: '5px' }}>
            {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Capturing location...'}
          </div>
        </div>
        <button onClick={handleCheckIn} disabled={saving} style={{ width: '100%', padding: '15px', background: saving ? '#999' : '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>
          {saving ? 'Saving...' : '✅ Check In Now'}
        </button>
        {status && <p style={{ marginTop: '15px', textAlign: 'center', color: status.includes('saved') ? '#27AE60' : '#E74C3C' }}>{status}</p>}
      </div>
      {history.length > 0 && (
        <div>
          <h2 style={{ color: '#1B3A6B', marginBottom: '15px' }}>Recent Check-Ins</h2>
          {history.map(h => (
            <div key={h.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{new Date(h.check_in_time || h.created_at).toLocaleString()}</p>
              <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>{h.latitude}, {h.longitude}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
