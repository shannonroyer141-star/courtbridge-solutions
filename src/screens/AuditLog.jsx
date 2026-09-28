import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const S = {
  page: { padding: '32px 36px', fontFamily: NAV_FONT, maxWidth: 1200 },
  header: { marginBottom: '20px' },
  title: { fontSize: '22px', fontWeight: '700', color: TEXT, margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: TEXT_MUTED, margin: 0 },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '20px' },
  filterBtn: (active) => ({
    fontSize: '12px', fontWeight: '600', padding: '6px 12px', borderRadius: '999px',
    border: `0.5px solid ${active ? ACCENT : BORDER}`, background: active ? 'rgba(91,155,240,0.15)' : 'transparent',
    color: active ? ACCENT : TEXT_MUTED, cursor: 'pointer',
  }),
  card: { background: CARD_BG, borderRadius: '10px', border: `0.5px solid ${BORDER}`, overflow: 'hidden' },
  row: { padding: '14px 18px', borderBottom: `0.5px solid ${BORDER}`, cursor: 'pointer' },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  name: { fontSize: '14px', fontWeight: '600', color: TEXT },
  sub: { fontSize: '12px', color: TEXT_DIM, marginTop: '2px' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' },
  emptyState: { padding: '32px 20px', textAlign: 'center', color: TEXT_MUTED, fontSize: '13px' },
  loading: { padding: '30px', color: TEXT_MUTED },
  detail: { marginTop: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '11px', color: TEXT_DIM, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 240, overflow: 'auto' },
};

const TABLE_LABELS = {
  clients: 'Client Record',
  case_notes: 'Case Note',
  clinical_notes: 'Clinical Note',
  messages: 'Message',
  violation_reports: 'Violation Report',
  records_access_requests: 'Records Access Request',
  profiles: 'Staff / Permissions',
  victim_contacts: 'Victim Contact (details withheld)',
  victim_notifications: 'Victim Notice',
};

const ACTION_STYLE = {
  insert: { label: 'Created', bg: 'rgba(76,175,125,0.15)', color: GREEN },
  update: { label: 'Updated', bg: 'rgba(61,111,168,0.2)', color: WARNING },
  delete: { label: 'Deleted', bg: 'rgba(248,113,113,0.15)', color: RED },
  view: { label: 'Viewed', bg: 'rgba(255,255,255,0.08)', color: TEXT_MUTED },
};

function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function AuditLog({ isFounder }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [actorById, setActorById] = useState(new Map());
  const [clientById, setClientById] = useState(new Map());
  const [orgById, setOrgById] = useState(new Map());
  const [tableFilter, setTableFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  async function fetchLog() {
    setLoading(true);

    const { data: log } = await supabase
      .from('audit_log')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(200);

    const actorIds = [...new Set((log || []).map(e => e.actor_id).filter(Boolean))];
    const clientIds = [...new Set((log || []).map(e => e.client_id).filter(Boolean))];
    const orgIds = [...new Set((log || []).map(e => e.organization_id).filter(Boolean))];

    const [{ data: actors }, { data: clients }, { data: orgs }] = await Promise.all([
      actorIds.length ? supabase.from('profiles').select('id, full_name, email').in('id', actorIds) : { data: [] },
      clientIds.length ? supabase.from('clients').select('id, name').in('id', clientIds) : { data: [] },
      isFounder && orgIds.length ? supabase.from('organizations').select('id, organization_name').in('id', orgIds) : { data: [] },
    ]);

    setActorById(new Map((actors || []).map(a => [a.id, a])));
    setClientById(new Map((clients || []).map(c => [c.id, c])));
    setOrgById(new Map((orgs || []).map(o => [o.id, o])));
    setEntries(log || []);
    setLoading(false);
  }

  useEffect(() => { fetchLog(); }, []);

  if (loading) return <div style={S.loading}>Loading audit trail...</div>;

  const filtered = tableFilter === 'all' ? entries : entries.filter(e => e.table_name === tableFilter);
  const tablesPresent = [...new Set(entries.map(e => e.table_name))];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Audit Log</h1>
        <p style={S.subtitle}>
          Every change to client records, notes, messages, violation reports, records requests, and staff permissions
          — recorded automatically and permanently. Nothing here can be edited or deleted, by anyone.
        </p>
      </div>

      <div style={S.filterRow}>
        <div style={S.filterBtn(tableFilter === 'all')} onClick={() => setTableFilter('all')}>All ({entries.length})</div>
        {tablesPresent.map(t => (
          <div key={t} style={S.filterBtn(tableFilter === t)} onClick={() => setTableFilter(t)}>
            {TABLE_LABELS[t] || t} ({entries.filter(e => e.table_name === t).length})
          </div>
        ))}
      </div>

      <div style={S.card}>
        {filtered.length === 0 ? (
          <div style={S.emptyState}>No audit entries yet — this fills in automatically as the app is used.</div>
        ) : filtered.map(e => {
          const actor = actorById.get(e.actor_id);
          const client = clientById.get(e.client_id);
          const org = orgById.get(e.organization_id);
          const actionStyle = ACTION_STYLE[e.action] || { label: e.action, bg: 'rgba(255,255,255,0.08)', color: TEXT_MUTED };
          const isOpen = expandedId === e.id;
          return (
            <div key={e.id} style={S.row} onClick={() => setExpandedId(isOpen ? null : e.id)}>
              <div style={S.rowTop}>
                <div>
                  <div style={S.name}>
                    {actor?.full_name || actor?.email || 'System / unknown actor'}
                    <span style={{ color: TEXT_DIM, fontWeight: 400 }}> · {TABLE_LABELS[e.table_name] || e.table_name}</span>
                    {client && <span style={{ color: TEXT_DIM, fontWeight: 400 }}> · {client.name}</span>}
                    {isFounder && org && <span style={{ color: TEXT_DIM, fontWeight: 400 }}> · {org.organization_name}</span>}
                  </div>
                  <div style={S.sub}>{new Date(e.occurred_at).toLocaleString()} · {timeAgo(e.occurred_at)}</div>
                </div>
                <span style={{ ...S.badge, background: actionStyle.bg, color: actionStyle.color }}>{actionStyle.label}</span>
              </div>
              {isOpen && (
                <div style={S.detail}>
                  {e.action === 'delete'
                    ? JSON.stringify(e.old_data, null, 2)
                    : JSON.stringify(e.new_data, null, 2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
