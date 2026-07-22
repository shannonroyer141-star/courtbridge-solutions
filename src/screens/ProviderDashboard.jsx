import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { supabase } from '../supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

function FitToMarkers({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
    } else {
      map.fitBounds(points.map(p => [p.latitude, p.longitude]), { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
}

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
  threeCol: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  mapCard: {
    background: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E8EDF4',
    boxShadow: '0 1px 4px rgba(27,58,107,0.06)',
    overflow: 'hidden',
    height: '260px',
  },
  urgentRow: {
    padding: '11px 20px',
    borderBottom: '1px solid #F5F7FA',
  },
  urgentSnippet: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  urgentBadge: {
    background: '#FDEDEC',
    color: '#C0392B',
    padding: '2px 8px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2563EB',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  footerLink: {
    display: 'block',
    textAlign: 'center',
    padding: '10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563EB',
    cursor: 'pointer',
    borderTop: '1px solid #F5F7FA',
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

export default function ProviderDashboard({ onNavigate }) {
  const [stats, setStats] = useState({ activeClients: 0, checkedInToday: 0, missedLast24: 0, alertsCount: 0 });
  const [missedClients, setMissedClients] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [complianceRate, setComplianceRate] = useState(0);
  const [urgentMessages, setUrgentMessages] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  function goToClient(clientId) {
    if (onNavigate) onNavigate('messages', clientId);
  }

  async function fetchDashboardData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data: clients } = await supabase.from('clients').select('*').eq('provider_id', user.id);
    const activeClients = clients?.length || 0;
    const clientIds = clients?.map(c => c.id) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const in7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const todayDateStr = todayStr.slice(0, 10);

    const { data: todayCheckIns } = await supabase.from('checkins').select('*').in('client_id', clientIds).gte('checked_in_at', todayStr);
    const { data: alerts } = await supabase.from('alerts').select('*').in('client_id', clientIds).eq('resolved', false);
    const { data: weekCheckIns } = await supabase.from('checkins').select('*').in('client_id', clientIds).gte('checked_in_at', new Date(Date.now() - 7 * 86400000).toISOString());
    const { data: recentCheckins } = await supabase.from('checkins').select('*, clients(name)').in('client_id', clientIds).order('checked_in_at', { ascending: false }).limit(10);
    const { data: locatedCheckins } = await supabase.from('checkins').select('*, clients(name)').in('client_id', clientIds).not('latitude', 'is', null).not('longitude', 'is', null).order('checked_in_at', { ascending: false }).limit(200);
    const { data: recentMessages } = await supabase.from('messages').select('*, clients(name)').in('client_id', clientIds).order('created_at', { ascending: false }).limit(200);
    const { data: upcomingCourtDates } = await supabase.from('court_dates').select('*, clients(name)').in('client_id', clientIds).gte('hearing_date', todayDateStr).lte('hearing_date', in7DaysStr).order('hearing_date');
    const { data: upcomingTasks } = await supabase.from('tasks').select('*').eq('provider_id', user.id).eq('completed', false).gte('due_date', todayStr).lte('due_date', in7DaysStr + 'T23:59:59').order('due_date');

    const missed = clients?.filter(c => !todayCheckIns?.some(ci => ci.client_id === c.id)) || [];
    const rate = activeClients > 0 ? Math.round(((weekCheckIns?.length || 0) / (activeClients * 7)) * 100) : 0;

    setStats({ activeClients, checkedInToday: todayCheckIns?.length || 0, missedLast24: missed.length, alertsCount: alerts?.length || 0 });
    setMissedClients(missed.slice(0, 5));
    setRecentActivity(recentCheckins || []);
    setComplianceRate(Math.min(rate, 100));

    const seenMapClients = new Set();
    setMapPoints((locatedCheckins || []).filter(ci => {
      if (seenMapClients.has(ci.client_id)) return false;
      seenMapClients.add(ci.client_id);
      return true;
    }));

    const latestPerClient = new Map();
    for (const m of recentMessages || []) {
      if (!latestPerClient.has(m.client_id)) latestPerClient.set(m.client_id, m);
    }
    setUrgentMessages([...latestPerClient.values()].filter(m => m.is_urgent && m.sender_role === 'client').slice(0, 5));

    const courtItems = (upcomingCourtDates || []).map(cd => ({
      id: `court-${cd.id}`, date: cd.hearing_date, label: `${cd.clients?.name || 'Unknown'} — ${cd.hearing_type || 'Court date'}`,
    }));
    const taskItems = (upcomingTasks || []).map(t => ({
      id: `task-${t.id}`, date: t.due_date?.slice(0, 10), label: t.title,
    }));
    setUpcoming([...courtItems, ...taskItems].sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 6));

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
          label="Checked In Today"
          value={stats.checkedInToday}
          sub={`Of ${stats.activeClients} active`}
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

      <div style={S.threeCol}>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={{ ...S.cardDot, background: '#2563EB' }} />
            <h3 style={S.cardTitle}>Last Known Locations</h3>
          </div>
          <div style={S.mapCard}>
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitToMarkers points={mapPoints} />
              {mapPoints.map(ci => (
                <Marker key={ci.id} position={[ci.latitude, ci.longitude]}>
                  <Popup><strong>{ci.clients?.name || 'Unknown client'}</strong></Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          {onNavigate && <div style={S.footerLink} onClick={() => onNavigate('mapview')}>View full map →</div>}
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={{ ...S.cardDot, background: urgentMessages.length > 0 ? '#C0392B' : '#1A7A47' }} />
            <h3 style={S.cardTitle}>Urgent Messages</h3>
          </div>
          <div style={S.cardBody}>
            {urgentMessages.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>✓</div>
                <p style={S.emptyText}>No unresolved urgent messages</p>
              </div>
            ) : (
              urgentMessages.map(m => (
                <div key={m.id} style={S.urgentRow}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={S.listName}>{m.clients?.name || 'Unknown'}</div>
                    <span style={S.urgentBadge}>Urgent</span>
                  </div>
                  <div style={S.urgentSnippet}>{m.body}</div>
                  <button style={{ ...S.linkBtn, marginTop: '4px' }} onClick={() => goToClient(m.client_id)}>Reply →</button>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <div style={S.cardDot} />
            <h3 style={S.cardTitle}>Coming Up (7 days)</h3>
          </div>
          <div style={S.cardBody}>
            {upcoming.length === 0 ? (
              <div style={S.emptyState}>
                <p style={S.emptyText}>Nothing scheduled this week</p>
              </div>
            ) : (
              upcoming.map(item => (
                <div key={item.id} style={S.listRow}>
                  <div style={S.listName}>{item.label}</div>
                  <div style={S.listSub}>
                    {item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
                  <button style={S.contactBtn} onClick={() => goToClient(client.id)}>Contact</button>
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
