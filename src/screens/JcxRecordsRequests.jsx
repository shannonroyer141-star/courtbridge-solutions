import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { FlagRestrictedButton } from '../components/VictimInfoWarning';

export default function JcxRecordsRequests({ session }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [decideError, setDecideError] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('records_access_requests').select('*, clients(name)').order('created_at', { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }

  async function decide(id, status) {
    setDecidingId(id);
    setDecideError(null);
    const { data, error } = await supabase.from('records_access_requests').update({
      status, decided_by: session.user.id, decided_at: new Date().toISOString(),
      decision_note: noteDrafts[id] || null,
    }).eq('id', id).select();
    setDecidingId(null);
    if (error) { setDecideError('That decision was not saved: ' + error.message); return; }
    if (!data || data.length === 0) { setDecideError("That decision was not saved — you may not have permission to decide on this request."); return; }
    load();
  }

  const statusColor = { pending: WARNING, approved: GREEN, denied: RED };
  const link = `${window.location.origin}/request-records`;

  if (loading) return <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading requests...</div>;

  const pending = requests.filter(r => r.status === 'pending');
  const decided = requests.filter(r => r.status !== 'pending');

  return (
    <div style={{ padding: 30, maxWidth: 820, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, margin: '0 0 4px' }}>Records Access Requests</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 20, fontSize: 14 }}>
        Courts, probation officers, or other agencies can request access to one of your client's compliance records. Nothing is shared until you explicitly approve — every decision is logged.
      </p>

      <div style={{ background: 'rgba(91,155,240,0.1)', border: `0.5px solid ${ACCENT}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: TEXT }}>
        Share this link with courts/POs who need to request records: <strong style={{ color: ACCENT }}>{link}</strong>
      </div>

      {decideError && <div style={{ color: RED, fontSize: 13, marginBottom: 16 }}>{decideError}</div>}

      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Pending Decision ({pending.length})</div>
      {pending.length === 0 ? <div style={{ color: TEXT_DIM, fontSize: 13, marginBottom: 20 }}>No pending requests.</div> : pending.map(r => (
        <div key={r.id} style={{ background: CARD_BG, border: `0.5px solid ${WARNING}`, borderRadius: 10, padding: 18, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.requester_name} — {r.requester_org_name}</div>
          <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 2 }}>{r.requester_role || 'Role not specified'} · {r.requester_email}{r.requester_phone ? ` · ${r.requester_phone}` : ''}</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 10 }}><strong>Client:</strong> {r.clients?.name || r.client_name_text || 'Unknown'}</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}><strong>Requesting:</strong> {r.scope_requested}</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}><strong>Reason:</strong> {r.reason}</div>
          <textarea
            placeholder="Optional note for your records"
            value={noteDrafts[r.id] || ''}
            onChange={e => setNoteDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, padding: 10, borderRadius: 8, border: `0.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 13, minHeight: 44 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => decide(r.id, 'approved')} disabled={decidingId === r.id} style={{ padding: '8px 16px', background: 'rgba(76,175,125,0.15)', color: GREEN, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {decidingId === r.id ? 'Saving...' : 'Approve'}
            </button>
            <button onClick={() => decide(r.id, 'denied')} disabled={decidingId === r.id} style={{ padding: '8px 16px', background: 'rgba(248,113,113,0.12)', color: RED, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Deny
            </button>
          </div>
          <div style={{ marginTop: 8 }}><FlagRestrictedButton tableName="records_access_requests" recordId={r.id} clientId={r.client_id} onFlagged={load} /></div>
        </div>
      ))}

      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '20px 0 10px' }}>Decided ({decided.length})</div>
      {decided.length === 0 ? <div style={{ color: TEXT_DIM, fontSize: 13 }}>Nothing decided yet.</div> : decided.map(r => (
        <div key={r.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.requester_name} — {r.clients?.name || r.client_name_text || 'Unknown'}</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: statusColor[r.status] }}>{r.status.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 6 }}>Decided {new Date(r.decided_at).toLocaleDateString()}{r.decision_note ? ` · ${r.decision_note}` : ''}</div>
        </div>
      ))}
    </div>
  );
}
