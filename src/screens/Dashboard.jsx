import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Dashboard() {
  const [totalClients, setTotalClients] = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const { count: c1 } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    const { count: c2 } = await supabase.from('Check_ins').select('*', { count: 'exact', head: true });
    const { count: c3 } = await supabase.from('alerts').select('*', { count: 'exact', head: true });
    setTotalClients(c1 || 0);
    setTotalCheckins(c2 || 0);
    setTotalAlerts(c3 || 0);
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '30px' }}>Dashboard</h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ background: '#1B3A6B', color: 'white', padding: '25px', borderRadius: '12px', minWidth: '160px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 'bold' }}>{totalClients}</div>
          <div style={{ marginTop: '8px' }}>Total Clients</div>
        </div>
        <div style={{ background: '#27AE60', color: 'white', padding: '25px', borderRadius: '12px', minWidth: '160px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 'bold' }}>{totalCheckins}</div>
          <div style={{ marginTop: '8px' }}>Check-Ins</div>
        </div>
        <div style={{ background: '#E74C3C', color: 'white', padding: '25px', borderRadius: '12px', minWidth: '160px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 'bold' }}>{totalAlerts}</div>
          <div style={{ marginTop: '8px' }}>Alerts</div>
        </div>
      </div>
    </div>
  );
}
