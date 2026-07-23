import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

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

  const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, fontSize: 16, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  if (loading) return (
    <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading settings...</div>
  );

  return (
    <div style={{ padding: 30, maxWidth: 600, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, marginBottom: 30 }}>My Preferences</h1>
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
        <h2 style={{ color: TEXT, marginBottom: 20, fontSize: 16 }}>Check-In Rules</h2>
        <label style={{ display: 'block', fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8 }}>Required Check-In Frequency</label>
        <select value={checkinFreq} onChange={e => setCheckinFreq(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }}>
          <option value="12">Every 12 hours</option>
          <option value="24">Every 24 hours</option>
          <option value="48">Every 48 hours</option>
          <option value="72">Every 72 hours</option>
          <option value="168">Once a week</option>
        </select>
      </div>
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
        <h2 style={{ color: TEXT, marginBottom: 20, fontSize: 16 }}>Alert Settings</h2>
        <label style={{ display: 'block', fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8 }}>Send missed check-in alerts to</label>
        <input type="email" placeholder="provider@email.com" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }} />
        <label style={{ display: 'block', fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8 }}>Your phone number (for urgent client alerts)</label>
        <input type="tel" placeholder="+15550001234" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
        <p style={{ fontSize: 12, color: TEXT_DIM, marginTop: 6 }}>When a client marks a message urgent, we text this number. Use the full format including country code, e.g. +15550001234.</p>
      </div>
      <button onClick={saveSettings} style={{ width: '100%', padding: 14, background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
