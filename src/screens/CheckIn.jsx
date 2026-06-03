import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function CheckIn() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
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
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setLocation({ lat, lng });
          reverseGeocode(lat, lng);
        },
        () => {
          setLocation({ lat: 'Unavailable', lng: '' });
          setAddress('Location unavailable');
        }
      );
    }
  }

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch {
      setAddress(`${lat}, ${lng}`);
    }
  }

  async function fetchHistory() {
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .order('checked_in_at', { ascending: false })
      .limit(5);
    if (data) setHistory(data);
  }

  async function handleCheckIn() {
    if (!location || location.lat === 'Unavailable') {
      setStatus('Waiting for GPS...');
      return;
    }
    setSaving(true);
    setStatus('');
    const { error } = await supabase.from('checkins').insert([{
      checked_in_at: new Date().toISOString(),
      latitude: location.lat,
      longitude: location.lng,
    }]);
    setSaving(false);
    if (error) {
      setStatus('Error: ' + error.message);
    } else {
      setStatus('✅ Check-in saved!');
      fetchHistory();
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '24px' }}>Check-In</h1>
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>Check-In Time</label>
          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', color: '#555' }}>
            {checkInTime || 'Loading...'}
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontWeight: '600', color: '#333', display: 'block', marginBottom: '6px' }}>Location</label>
          <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', color: '#555', fontSize: '14px' }}>
            {address || (location ? `${location.lat}, ${location.lng}` : 'Getting location...')}
          </div>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={saving}
          style={{ width: '100%', padding: '14px', background: saving ? '#aaa' : '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : '✅ Check In Now'}
        </button>
        {status && (
          <p style={{ marginTop: '12px', textAlign: 'center', color: status.startsWith('Error') ? '#dc2626' : '#16a34a', fontWeight: '600' }}>
            {status}
          </p>
        )}
      </div>
      {history.length > 0 && (
        <div>
          <h3 style={{ color: '#1B3A6B', marginBottom: '8px' }}>Recent Check-Ins</h3>
          {history.map((h, i) => (
            <div key={i} style={{ padding: '10px 14px', background: 'white', borderRadius: '8px', marginBottom: '6px', fontSize: '14px', color: '#555', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {new Date(h.checked_in_at || h.created_at).toLocaleString()} — {h.latitude ? `${h.latitude}, ${h.longitude}` : 'No location'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}