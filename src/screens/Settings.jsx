import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Settings() {
  const [checkinFreq, setCheckinFreq] = useState('24');
  const [alertEmail, setAlertEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles')
      .select('checkin_frequency_hours, alert_email, phone')
      .eq('id', user.id)
      .single();
    if (data) {
      setCheckinFreq(String(data.checkin_frequency_hours ?? 24));
      setAlertEmail(data.alert_email || '');
      setPhone(data.phone || '');
    }
    setLoading(false);
  }

  function normalizePhone(raw) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return `+${digits}`;
  }

  async function saveSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    const normalizedPhone = normalizePhone(phone);
    await supabase.from('profiles').update({ checkin_frequency_hours: parseInt(checkinFreq), alert_email: alertEmail, phone: normalizedPhone }).eq('id', user.id);
    setPhone(normalizedPhone);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div style={{ padding: '30px', color: '#666' }}>Loading settings...</div>
  );

  return (
    <div style={{ padding: '30px', maxWidth: '600px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '30px' }}>Settings</h1>
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
        <h2 style={{ color: '#1B3A6B', marginBottom: '20px', fontSize: '16px' }}>Check-In Rules</h2>
        <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Required Check-In Frequency</label>
        <select value={checkinFreq} onChange={e => setCheckinFreq(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '20px' }}>
          <option value="12">Every 12 hours</option>
          <option value="24">Every 24 hours</option>
          <option value="48">Every 48 hours</option>
          <option value="72">Every 72 hours</option>
          <option value="168">Once a week</option>
        </select>
      </div>
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
        <h2 style={{ color: '#1B3A6B', marginBottom: '20px', fontSize: '16px' }}>Alert Settings</h2>
        <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Send missed check-in alerts to</label>
        <input type="email" placeholder="provider@email.com" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box', marginBottom: '20px' }} />
        <label style={{ display: 'block', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Your phone number (for urgent client alerts)</label>
        <input type="tel" placeholder="+15550001234" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
        <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>When a client marks a message urgent, we text this number. Use the full format including country code, e.g. +15550001234.</p>
      </div>
      <button onClick={saveSettings} style={{ width: '100%', padding: '14px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
