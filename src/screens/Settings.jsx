import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function Settings() {
  const [checkinFreq, setCheckinFreq] = useState('24');
  const [alertEmail, setAlertEmail] = useState('');
  const [saved, setSaved] = useState(false);

  async function saveSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({ checkin_frequency_hours: parseInt(checkinFreq), alert_email: alertEmail }).eq('id', user.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

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
        <input type="email" placeholder="provider@email.com" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
      </div>
      <button onClick={saveSettings} style={{ width: '100%', padding: '14px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>
        {saved ? '✅ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
