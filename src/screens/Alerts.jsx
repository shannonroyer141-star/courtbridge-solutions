import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { fetchAlerts(); }, []);

  async function fetchAlerts() {
    const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
    if (data) setAlerts(data);
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '20px' }}>Alerts</h1>
      {alerts.length === 0 ? (
        <p>No alerts at this time. 🎉</p>
      ) : alerts.map(a => (
        <div key={a.id} style={{ background: '#fdecea', border: '1px solid #f5c6cb', padding: '15px', borderRadius: '10px', marginBottom: '10px' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#721c24' }}>⚠️ {a.message || 'Missed check-in'}</p>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#a94442' }}>{new Date(a.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
