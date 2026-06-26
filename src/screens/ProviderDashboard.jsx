import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const S = {
  page: {
    padding: '32px 36px',
    background: '#FFFFFF',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #E8EDF4',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1B3A6B',
    margin: '0 0 4px',
    letterSpacing: '-0.3px',
  },
  headerDate: {
    fontSize: '13px',
    color: '#8A9BB0',
    margin: 0,
    fontWeight: '400',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    background: '#FFFFFF',
    borderRadius: '10px',
    padding: '20px 22px',
    border: '1px solid #E8EDF4',
    boxShadow: '0 1px 4px rgba(27,58,107,0.06)',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#8A9BB0',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    marginBottom: '10px',
  },
  statValue: {
    fontSize: '34px',
    fontWeight: '700',
    lineHeight: 1,
    marginBottom: '4px',
  },
  statSub: {
    fontSize: '12px',
    color: '#B0BCC8',
    marginTop: '6px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  card: {
    background: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E8EDF4',
    boxShadow: '0 1px 4px rgba(27,58,107,0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #F0F4FA',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1B3A6B',
    margin: 0,
  },
  cardDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#1B3A6B',
    flexShrink: 0,
  },
  cardBody: {
    padding: '4px 0',
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '11px 20px',
    borderBottom: '1px solid #F5F7FA',
  },
  listName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1E2D3D',
    marginBottom: '2px',
  },
  listSub: {
    fontSize: '12px',
    color: '#B0BCC8',
  },
  listSubAlert: {
    fontSize: '12px',
    color: '#C0392B',
  },
  badgeGreen: {
    background: '#EBF8F1',
    color: '#1A7A47',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  contactBtn: {
    background: '#1B3A6B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.2px',
  },
  emptyState: {
    padding: '32px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#EBF8F1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 10px',
    fontSize: '16px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#8A9BB0',
    margin: 0,
  },
  complianceCard: {
    background: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E8EDF4',
    boxShadow: '0 1px 4px rgba(27,58,107,0.06)',
    padding: '20px 22px',
  },
  complianceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    marginTop: '14px',
  },
  progressTrack: {
    flex: 1,
    background: '#F0F4FA',
    borderRadius: '6px',
    height: '10px',
    overflow: 'hidden',
  },
  compliancePct: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1B3A6B',
    minWidth: '56px',
    textAlign: 'right',
  },
  complianceSub: {
    fontSize: '12px',
    color: '#B0BCC8',
    marginTop: '8px',
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
  },
  loadingText: {
    fontSize: '14px',
    color: '#8A9BB0',
  },
};

function StatCard({ label, value, sub, valueColor = '#1B3A6B', accentColor = '#1B3A6B' }) {
  return (
    <div style={{ ...S.statCard, borderTop: `3px solid ${accentColor}` }}>
      <div style={S.statLabel}>{label}</div>
      <div style={{ ...S.statValue, color: valueColor }}>{value}</div>
      {sub && <div style={S.statSub}>{sub}</div>}
    </div>
  );
}

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
    <div style={S.loadingWrap}>
      <p style={S.loadingText}>Loading dashboard...</p>
    </div>
  );

  const missedColor = stats.missedLast24 > 0 ? '#C0392B' : '#1A7A47';
  const alertColor = stats.alertsCount > 0 ? '#D4580A' : '#1A7A47';
  const progressColor = complianceRate >= 80 ? '#1A7A47' : complianceRate >= 60 ? '#D4580A' : '#C0392B';

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.headerTitle}>Provider Dashboard</h1>
        <p style={S.headerDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={S.statGrid}>
        <StatCard
          label="Active Clients"
          value={stats.activeClients}
          sub="Total enrolled"
          accentColor="#1B3A6B"
        />
        <StatCard
          label="Expected Today"
          value={stats.expectedToday}
          sub="Check-ins due"
          accentColor="#2563EB"
        />
        <StatCard
          label="Missed (24 hrs)"
          value={stats.missedLast24}
          sub={stats.missedLast24 === 0 ? 'All checked in' : 'Need follow-up'}
          valueColor={missedColor}
          accentColor={missedColor}
        />
        <StatCard
          label="Open Alerts"
          value={stats.alertsCount}
          sub={stats.alertsCount === 0 ? 'No action needed' : 'Needs review'}
          valueColor={alertColor}
          accentColor={alertColor}
        />
      </div>

      <div style={S.twoCol}>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={{ ...S.cardDot, background: stats.missedLast24 > 0 ? '#C0392B' : '#1A7A47' }} />
            <h3 style={S.cardTitle}>Needs Attention</h3>
          </div>
          <div style={S.cardBody}>
            {missedClients.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>✓</div>
                <p style={S.emptyText}>All clients checked in today</p>
              </div>
            ) : (
              missedClients.map(client => (
                <div key={client.id} style={S.listRow}>
                  <div>
                    <div style={S.listName}>{client.name}</div>
                    <div style={S.listSubAlert}>No check-in today</div>
                  </div>
                  <button style={S.contactBtn}>Contact</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.cardDot} />
            <h3 style={S.cardTitle}>Recent Check-Ins</h3>
          </div>
          <div style={S.cardBody}>
            {recentActivity.length === 0 ? (
              <div style={S.emptyState}>
                <p style={S.emptyText}>No recent check-ins</p>
              </div>
            ) : (
              recentActivity.map(ci => (
                <div key={ci.id} style={S.listRow}>
                  <div>
                    <div style={S.listName}>{ci.clients?.name || 'Unknown'}</div>
                    <div style={S.listSub}>
                      {new Date(ci.checked_in_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <span style={S.badgeGreen}>Present</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={S.complianceCard}>
        <div style={S.cardHeader}>
          <div style={S.cardDot} />
          <h3 style={S.cardTitle}>Weekly Compliance Rate</h3>
        </div>
        <div style={S.complianceRow}>
          <div style={S.progressTrack}>
            <div style={{
              width: `${complianceRate}%`,
              background: progressColor,
              height: '100%',
              borderRadius: '6px',
              transition: 'width 0.6s ease',
            }} />
          </div>
          <div style={{ ...S.compliancePct, color: progressColor }}>{complianceRate}%</div>
        </div>
        <p style={S.complianceSub}>Based on check-ins over the last 7 days across all active clients</p>
      </div>
    </div>
  );
}
