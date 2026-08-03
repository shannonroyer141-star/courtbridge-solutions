import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

export default function Settings() {
  const [alertEmail, setAlertEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [backupName, setBackupName] = useState('');
  const [backupPhone, setBackupPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles')
      .select('alert_email, phone, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, backup_contact_name, backup_contact_phone')
      .eq('id', user.id)
      .single();
    if (data) {
      setAlertEmail(data.alert_email || '');
      setPhone(data.phone || '');
      setQuietHoursEnabled(!!data.quiet_hours_enabled);
      setQuietHoursStart(data.quiet_hours_start || '21:00');
      setQuietHoursEnd(data.quiet_hours_end || '08:00');
      setBackupName(data.backup_contact_name || '');
      setBackupPhone(data.backup_contact_phone || '');
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
    const normalizedBackupPhone = backupPhone ? normalizePhone(backupPhone) : '';
    if (quietHoursEnabled && !normalizedBackupPhone) {
      setSaveError('Add a backup contact number, or turn off quiet hours — urgent alerts always need somewhere to go.');
      return;
    }
    const { error } = await supabase.from('profiles').update({
      alert_email: alertEmail, phone: normalizedPhone,
      quiet_hours_enabled: quietHoursEnabled, quiet_hours_start: quietHoursStart, quiet_hours_end: quietHoursEnd,
      backup_contact_name: backupName, backup_contact_phone: normalizedBackupPhone,
    }).eq('id', user.id);
    if (error) { setSaveError('Could not save: ' + error.message); return; }
    setPhone(normalizedPhone);
    setBackupPhone(normalizedBackupPhone);
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

      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
        <h2 style={{ color: TEXT, marginBottom: 8, fontSize: 16 }}>Quiet Hours</h2>
        <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 0, marginBottom: 18, lineHeight: 1.5 }}>
          Urgent alerts always go somewhere — they never just get skipped. During quiet hours, they'll go to your backup contact instead of your personal phone.
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: TEXT, marginBottom: 18, cursor: 'pointer' }}>
          <input type="checkbox" checked={quietHoursEnabled} onChange={e => setQuietHoursEnabled(e.target.checked)} />
          Use quiet hours
        </label>
        {quietHoursEnabled && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>From</label>
                <input type="time" value={quietHoursStart} onChange={e => setQuietHoursStart(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>Until</label>
                <input type="time" value={quietHoursEnd} onChange={e => setQuietHoursEnd(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>
            <label style={{ display: 'block', fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8 }}>Backup contact name</label>
            <input value={backupName} onChange={e => setBackupName(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }} placeholder="e.g. on-call staff, agency crisis line" />
            <label style={{ display: 'block', fontWeight: 'bold', color: TEXT_MUTED, marginBottom: 8 }}>Backup contact phone *</label>
            <input type="tel" value={backupPhone} onChange={e => setBackupPhone(e.target.value)} style={inputStyle} placeholder="+15550001234" />
          </>
        )}
      </div>

      <p style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12 }}>Check-in frequency is set per client now — open a client under Clients to set how often they're required to check in.</p>
      {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
      <button onClick={saveSettings} style={{ width: '100%', padding: 14, background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
