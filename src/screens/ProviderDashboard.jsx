import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function ProviderDashboard() {
  const [stats, setStats] = useState({ activeClients: 0, expectedToday: 0, missedLast24: 0, alertsCount: 0 });
  const [missedClients, setMissedClients] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [complianceRate, setComplianceRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  async function fetchDashboardData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: clients } = await supabase.from('clients').select('*').eq('provider_id', user.id);
    const activeClients = clients?.length || 0;
    const clientIds = clients?.map(c => c.id) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    const { data: todayCheckIns } = await supabase.from('checkins').select('*').in('client_id', clientIds).gte('checked_in_at', todayStr);
    const { data: missedCheckIns } = await supabase.from('checkins').select('*, clients(name)').in('client_id', clientIds).gte('checked_in_at', yesterday).eq('is_catch', false);
    const { data: alerts } = await supabase.from('alerts').select('*').in('client_id', clientIds).eq('resolved', false);
    const { data: weekCheckIns } = await supabase.from('checkins').select('*').in('client_id', clientIds).gte('checked_in_at', new Date(Date.now() - 7 * 86400000).toISOString());
    const { data: recentCheckins } = await supabase.from('checkins').select('*, clients(name)').in('client_id', clientIds).order('checked_in_at', { ascending: false }).limit(10);

    const missed = clients?.filter(c => !todayCheckIns?.some(ci => ci.client_id === c.id)) || [];
    const rate = activeClients > 0 ? Math.round(((weekCheckIns?.length || 0) / (activeClients * 7)) * 100) : 0;

    setStats({ activeClients, expectedToday: activeClients, missedLast24: missed.length, alertsCount: alerts?.length || 0 });
    setMissedClients(missed.slice(0, 5));
    setRecentActivity(recentCheckins || []);
    setComplianceRate(Math.min(rate, 100));
    setLoading(false);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <p style={{ color: '#8A9BB0' }}>Loading dashboard...</p>
    </div>
  );

  const statCards = [
    { label: 'Active Clients', value: stats.activeClients, color: '#1B3A6B', icon: '👥' },
    { label: 'Expected Check-Ins Today', value: stats.expectedToday, color: '#27AE60', icon: '📍' },
    { label: 'Missed (Last 24hrs)', value: stats.missedLast24, color: stats.missedLast24 > 0 ? '#E74C3C' : '#27AE60', icon: '⚠️' },
    { label: 'Alerts Needing Action', value: stats.alertsCount, color: stats.alertsCount > 0 ? '#E67E22' : '#27AE60', icon: '🔔' },
  ];

  return (
    <div style={{ padding: '30px', background: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', fontSize: '24px', margin: 0 }}>Provider Dashboard</h1>
        <p style={{ color: '#8A9BB0', fontSize: '14px', marginTop: '4px' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', borderTop: `4px solid ${card.color}` }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>{card.icon}</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: '#8A9BB0', marginTop: '4px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#1B3A6B', fontSize: '16px', margin: '0 0 16px' }}>⚠️ Needs Attention</h3>
          {missedClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#27AE60' }}>
              <div style={{ fontSize: '24px' }}>✅</div>
              <p style={{ margin: '8px 0 0', fontSize: '14px' }}>All clients checked in today!</p>
            </div>
          ) : (
            missedClients.map(client => (
              <div key={client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#2C3E50', fontSize: '14px' }}>{client.name}</div>
                  <div style={{ fontSize: '12px', color: '#E74C3C' }}>Has not checked in today</div>
                </div>
                <button style={{ background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                  Contact
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#1B3A6B', fontSize: '16px', margin: '0 0 16px' }}>📋 Recent Check-Ins</h3>
          {recentActivity.length === 0 ? (
            <p style={{ color: '#8A9BB0', fontSize: '14px' }}>No recent check-ins.</p>
          ) : (
            recentActivity.map(ci => (
              <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#2C3E50', fontSize: '14px' }}>{ci.clients?.name || 'Unknown'}</div>
                  <div style={{ fontSize: '12px', color: '#8A9BB0' }}>{new Date(ci.checked_in_at).toLocaleString()}</div>
                </div>
                <div style={{ background: '#eafaf1', color: '#1e8449', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>✓ Present</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ color: '#1B3A6B', fontSize: '16px', margin: '0 0 16px' }}>📈 Weekly Compliance Rate</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '8px', height: '12px' }}>
            <div style={{ width: `${complianceRate}%`, background: complianceRate >= 80 ? '#27AE60' : complianceRate >= 60 ? '#E67E22' : '#E74C3C', height: '12px', borderRadius: '8px', transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1B3A6B', minWidth: '60px' }}>{complianceRate}%</div>
        </div>
        <p style={{ color: '#8A9BB0', fontSize: '13px', marginTop: '8px' }}>Based on check-ins over the last 7 days</p>
      </div>
    </div>
  );
}