import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Dashboard() {
  const [totalClients, setTotalClients] = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [todayCheckins, setTodayCheckins] = useState(0);
  const [missedToday, setMissedToday] = useState(0);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const { count: c1 } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    const { count: c2 } = await supabase.from('checkins').select('*', { count: 'exact', head: true });
    const { count: c3 } = await supabase.from('alerts').select('*', { count: 'exact', head: true });
    const today = new Date(); today.setHours(0,0,0,0);
    const { count: c4 } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).gte('checked_in_at', today.toISOString());
    const { data: clients } = await supabase.from('clients').select('id');
    const { data: todayIns } = await supabase.from('checkins').select('client_id').gte('checked_in_at', today.toISOString());
    const checkedInIds = new Set((todayIns || []).map(c => c.client_id));
    setTotalClients(c1 || 0);
    setTotalCheckins(c2 || 0);
    setTotalAlerts(c3 || 0);
    setTodayCheckins(c4 || 0);
    setMissedToday(missed);
  }

  const cards = [
    { label: 'Total Clients', value: totalClients, bg: '#1B3A6B' },
    { label: 'Check-Ins Today', value: todayCheckins, bg: '#27AE60' },
    { label: 'Total Check-Ins', value: totalCheckins, bg: '#2980B9' },
    { label: 'Missed Today', value: missedToday, bg: missedToday > 0 ? '#E74C3C' : '#27AE60' },
    { label: 'Active Alerts', value: totalAlerts, bg: totalAlerts > 0 ? '#E74C3C' : '#27AE60' },
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '8px', textAlign: 'center' }}>Dashboard</h1>
      <p style={{ color: '#8A9BB0', textAlign: 'center', marginTop: '10px', marginBottom: '32px' }}>CourtBridge Solutions — Provider Overview</p>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: card.bg, color: 'white', padding: '25px', borderRadius: '12px', minWidth: '160px', textAlign: 'center', flex: '1' }}>
            <div style={{ fontSize: '42px', fontWeight: 'bold' }}>{card.value}</div>
            <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.9 }}>{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}