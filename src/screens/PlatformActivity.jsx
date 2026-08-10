import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const S = {
  page: { padding: '32px 36px', fontFamily: NAV_FONT, maxWidth: 1200 },
  header: { marginBottom: '8px' },
  title: { fontSize: '22px', fontWeight: '700', color: TEXT, margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: TEXT_MUTED, margin: '0 0 28px' },
  sectionTitle: { fontSize: '14px', fontWeight: '700', color: TEXT, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  card: { background: CARD_BG, borderRadius: '10px', border: `0.5px solid ${BORDER}`, overflow: 'hidden', marginBottom: '28px' },
  row: { padding: '14px 18px', borderBottom: `0.5px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  name: { fontSize: '14px', fontWeight: '600', color: TEXT },
  sub: { fontSize: '12px', color: TEXT_DIM, marginTop: '2px' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' },
  emptyState: { padding: '32px 20px', textAlign: 'center', color: TEXT_MUTED, fontSize: '13px' },
  loading: { padding: '30px', color: TEXT_MUTED },
};

function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function PlatformActivity() {
  const [loading, setLoading] = useState(true);
  const [orgRows, setOrgRows] = useState([]);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [urgentMessages, setUrgentMessages] = useState([]);
  const [smsFailures, setSmsFailures] = useState([]);

  async function fetchActivity() {
    setLoading(true);

    const [{ data: orgs }, { data: profiles }, { data: clients }] = await Promise.all([
      supabase.from('organizations').select('id, organization_name, plan, subscription_status, created_at'),
      supabase.from('profiles').select('id, organization_id'),
      supabase.from('clients').select('id, name, provider_id, status'),
    ]);

    const orgIdByProviderId = new Map((profiles || []).map(p => [p.id, p.organization_id]));
    const orgById = new Map((orgs || []).map(o => [o.id, o]));
    const clientById = new Map((clients || []).map(c => [c.id, c]));

    function orgForClient(clientId) {
      const client = clientById.get(clientId);
      const orgId = client ? orgIdByProviderId.get(client.provider_id) : null;
      return orgId ? orgById.get(orgId) : null;
    }

    const clientCountByOrg = new Map();
    for (const c of clients || []) {
      const orgId = orgIdByProviderId.get(c.provider_id);
      if (!orgId) continue;
      clientCountByOrg.set(orgId, (clientCountByOrg.get(orgId) || 0) + 1);
    }
    setOrgRows((orgs || []).map(o => ({ ...o, clientCount: clientCountByOrg.get(o.id) || 0 })).sort((a, b) => b.clientCount - a.clientCount));

    const since48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data: checkins } = await supabase
      .from('checkins').select('id, client_id, checked_in_at')
      .gte('checked_in_at', since48h).order('checked_in_at', { ascending: false }).limit(30);
    setRecentCheckins((checkins || []).map(ci => ({
      ...ci, clientName: clientById.get(ci.client_id)?.name || 'Unknown client', org: orgForClient(ci.client_id),
    })));

    const { data: urgent } = await supabase
      .from('messages').select('id, client_id, body, created_at')
      .eq('is_urgent', true).eq('sender_role', 'client')
      .order('created_at', { ascending: false }).limit(20);
    setUrgentMessages((urgent || []).map(m => ({
      ...m, clientName: clientById.get(m.client_id)?.name || 'Unknown client', org: orgForClient(m.client_id),
    })));

    const { data: sms } = await supabase
      .from('sms_logs').select('id, client_id, status, created_at')
      .neq('status', 'sent').neq('status', 'delivered')
      .order('created_at', { ascending: false }).limit(20);
    setSmsFailures((sms || []).map(s => ({
      ...s, clientName: clientById.get(s.client_id)?.name || 'Unknown client', org: orgForClient(s.client_id),
    })));

    setLoading(false);
  }

  useEffect(() => { fetchActivity(); }, []);

  if (loading) return <div style={S.loading}>Loading platform activity...</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Platform Activity</h1>
        <p style={S.subtitle}>Preview: cross-organization visibility, founder-only. Not everything is wired up yet.</p>
      </div>

      <h2 style={S.sectionTitle}>Organizations ({orgRows.length})</h2>
      <div style={S.card}>
        {orgRows.length === 0 ? <div style={S.emptyState}>No organizations yet.</div> : orgRows.map(o => (
          <div key={o.id} style={S.row}>
            <div>
              <div style={S.name}>{o.organization_name || 'Unnamed org'}</div>
              <div style={S.sub}>{o.clientCount} client{o.clientCount === 1 ? '' : 's'} · joined {timeAgo(o.created_at)}</div>
            </div>
            <span style={{ ...S.badge, background: o.subscription_status === 'active' ? 'rgba(76,175,125,0.15)' : 'rgba(255,255,255,0.08)', color: o.subscription_status === 'active' ? GREEN : TEXT_MUTED }}>
              {o.plan || 'no plan'} · {o.subscription_status || 'unknown'}
            </span>
          </div>
        ))}
      </div>

      <h2 style={S.sectionTitle}>Urgent Messages Needing Attention ({urgentMessages.length})</h2>
      <div style={S.card}>
        {urgentMessages.length === 0 ? <div style={S.emptyState}>No urgent client messages.</div> : urgentMessages.map(m => (
          <div key={m.id} style={S.row}>
            <div>
              <div style={S.name}>{m.clientName} <span style={{ color: TEXT_DIM, fontWeight: 400 }}>· {m.org?.organization_name || 'Unknown org'}</span></div>
              <div style={S.sub}>{(m.body || '').slice(0, 100)}{(m.body || '').length > 100 ? '...' : ''}</div>
            </div>
            <span style={{ ...S.badge, background: 'rgba(248,113,113,0.15)', color: RED }}>{timeAgo(m.created_at)}</span>
          </div>
        ))}
      </div>

      <h2 style={S.sectionTitle}>SMS Failures ({smsFailures.length})</h2>
      <div style={S.card}>
        {smsFailures.length === 0 ? <div style={S.emptyState}>No SMS failures.</div> : smsFailures.map(s => (
          <div key={s.id} style={S.row}>
            <div>
              <div style={S.name}>{s.clientName} <span style={{ color: TEXT_DIM, fontWeight: 400 }}>· {s.org?.organization_name || 'Unknown org'}</span></div>
              <div style={S.sub}>{timeAgo(s.created_at)}</div>
            </div>
            <span style={{ ...S.badge, background: 'rgba(61,111,168,0.2)', color: WARNING }}>{s.status}</span>
          </div>
        ))}
      </div>

      <h2 style={S.sectionTitle}>Recent Check-Ins, last 48h ({recentCheckins.length})</h2>
      <div style={S.card}>
        {recentCheckins.length === 0 ? <div style={S.emptyState}>No check-ins in the last 48 hours.</div> : recentCheckins.map(ci => (
          <div key={ci.id} style={S.row}>
            <div>
              <div style={S.name}>{ci.clientName} <span style={{ color: TEXT_DIM, fontWeight: 400 }}>· {ci.org?.organization_name || 'Unknown org'}</span></div>
            </div>
            <span style={{ ...S.badge, background: 'rgba(91,155,240,0.15)', color: ACCENT }}>{timeAgo(ci.checked_in_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
