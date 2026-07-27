import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

export default function Settings() {
  const [alertEmail, setAlertEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles')
      .select('alert_email, phone')
      .eq('id', user.id)
      .single();
    if (data) {
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
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const normalizedPhone = normalizePhone(phone);
    const { error } = await supabase.from('profiles').update({ alert_email: alertEmail, phone: normalizedPhone }).eq('id', user.id);
    if (error) { setSaveError('Could not save: ' + error.message); return; }
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
        <h2 style={{ color: TEXT, marginBottom: 20, fontSize: 16 }}>Alert Settings</h2>
        <label style={{ display: 'block', fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8 }}>Send missed check-in alerts to</label>
        <input type="email" placeholder="provider@email.com" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }} />
        <label style={{ display: 'block', fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8 }}>Your phone number (for urgent client alerts)</label>
        <input type="tel" placeholder="+15550001234" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
        <p style={{ fontSize: 12, color: TEXT_DIM, marginTop: 6 }}>When a client marks a message urgent, we text this number. Use the full format including country code, e.g. +15550001234.</p>
      </div>
      <p style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12 }}>Check-in frequency is set per client now — open a client under Clients to set how often they're required to check in.</p>
      {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
      <button onClick={saveSettings} style={{ width: '100%', padding: 14, background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
