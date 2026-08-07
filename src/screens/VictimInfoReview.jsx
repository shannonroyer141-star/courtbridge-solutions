import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const FLAGGABLE_TABLES = [
  'case_notes', 'clinical_notes', 'client_progress_notes', 'contact_log', 'court_dates',
  'cps_cases', 'documents', 'meeting_log', 'po_visits', 'service_records',
  'violation_reports', 'referrals', 'records_access_requests',
];

const STATUS_LABELS = {
  restricted: 'Restricted — Pending Review',
  reviewed: 'Reviewed — Not Victim Info',
  removed: 'Removed',
  retained_legal_hold: 'Retained (Legal Hold)',
  replaced: 'Replaced',
};

const STATUS_COLORS = {
  restricted: RED, reviewed: GREEN, removed: TEXT_DIM, retained_legal_hold: WARNING, replaced: ACCENT,
};

export default function VictimInfoReview() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});
  const [showManual, setShowManual] = useState(false);
  const [clients, setClients] = useState([]);
  const [manualForm, setManualForm] = useState({ table_name: '', record_id: '', client_id: '', reason: '' });
  const [manualError, setManualError] = useState(null);

  useEffect(() => { fetchFlags(); fetchClients(); }, []);

  async function fetchFlags() {
    setLoading(true);
    const { data } = await supabase.from('victim_info_flags').select('*, clients(name)').order('flagged_at', { ascending: false });
    setFlags(data || []);
    setLoading(false);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function resolve(flag, status, { restoreAccess = false, deleteRecord = false } = {}) {
    setActioning(flag.id);
    const { data: { user } } = await supabase.auth.getUser();
    const resolution_notes = notesDraft[flag.id] || null;

    if (deleteRecord) {
      await supabase.from(flag.table_name).delete().eq('id', flag.record_id);
    } else if (restoreAccess) {
      await supabase.from(flag.table_name).update({ restricted: false }).eq('id', flag.record_id);
    } else if (status === 'retained_legal_hold') {
      await supabase.from(flag.table_name).update({ restricted: true }).eq('id', flag.record_id);
    }

    await supabase.from('victim_info_flags').update({
      status, resolution_notes, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
      legal_hold: status === 'retained_legal_hold',
    }).eq('id', flag.id);

    setActioning(null);
    fetchFlags();
  }

  async function submitManualFlag() {
    setManualError(null);
    if (!manualForm.table_name || !manualForm.record_id) { setManualError('Table and record ID are required.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error: flagError } = await supabase.from('victim_info_flags').insert([{
      table_name: manualForm.table_name, record_id: manualForm.record_id,
      client_id: manualForm.client_id || null, flagged_by: user.id, reason: manualForm.reason || null,
    }]);
    if (flagError) { setManualError('Could not create flag: ' + flagError.message); return; }
    const { error: restrictError } = await supabase.from(manualForm.table_name).update({ restricted: true }).eq('id', manualForm.record_id);
    if (restrictError) { setManualError('Flag created, but could not restrict the record: ' + restrictError.message); }
    setManualForm({ table_name: '', record_id: '', client_id: '', reason: '' });
    setShowManual(false);
    fetchFlags();
  }

  const inputStyle = { padding: 10, marginBottom: 10, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 13, width: '100%' };

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <div>
          <h1 style={{ color: TEXT, margin: 0 }}>Victim Information Review</h1>
          <p style={{ color: TEXT_MUTED, fontSize: 13.5, marginTop: 6, maxWidth: 620 }}>
            Records flagged as possibly containing victim-identifying information. Flagged records are immediately hidden from ordinary providers and clients until reviewed here.
          </p>
        </div>
        <button onClick={() => setShowManual(!showManual)} style={{ padding: '10px 18px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>
          {showManual ? 'Cancel' : '+ Flag a Record Manually'}
        </button>
      </div>

      {showManual && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <p style={{ color: TEXT_DIM, fontSize: 12, marginBottom: 12 }}>Use this if a record needs to be restricted but doesn't have a flag button yet on its own screen.</p>
          <select value={manualForm.table_name} onChange={e => setManualForm({ ...manualForm, table_name: e.target.value })} style={inputStyle}>
            <option value="">Table *</option>
            {FLAGGABLE_TABLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input placeholder="Record ID (UUID) *" value={manualForm.record_id} onChange={e => setManualForm({ ...manualForm, record_id: e.target.value })} style={inputStyle} />
          <select value={manualForm.client_id} onChange={e => setManualForm({ ...manualForm, client_id: e.target.value })} style={inputStyle}>
            <option value="">Client (optional)</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea placeholder="Reason" value={manualForm.reason} onChange={e => setManualForm({ ...manualForm, reason: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />
          {manualError && <div style={{ color: RED, fontSize: 12.5, marginBottom: 10 }}>{manualError}</div>}
          <button onClick={submitManualFlag} style={{ padding: '10px 20px', background: RED, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13.5 }}>Flag &amp; Restrict</button>
        </div>
      )}

      {loading ? <p style={{ color: TEXT_MUTED }}>Loading...</p> : flags.length === 0 ? (
        <p style={{ color: TEXT_DIM }}>No records have been flagged.</p>
      ) : flags.map(f => (
        <div key={f.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>{f.table_name} <span style={{ color: TEXT_DIM, fontWeight: 400 }}>· {f.record_id}</span></div>
              <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 2 }}>{f.clients?.name || 'No client linked'} · flagged {new Date(f.flagged_at).toLocaleString()}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, color: STATUS_COLORS[f.status], background: `${STATUS_COLORS[f.status]}22` }}>{STATUS_LABELS[f.status]}</span>
          </div>
          {f.reason && <p style={{ fontSize: 13, color: TEXT, margin: '0 0 10px' }}>{f.reason}</p>}
          {f.resolution_notes && <p style={{ fontSize: 12.5, color: TEXT_DIM, margin: '0 0 10px' }}>Resolution: {f.resolution_notes}</p>}

          {f.status === 'restricted' && (
            <div>
              <textarea placeholder="Resolution notes" value={notesDraft[f.id] || ''} onChange={e => setNotesDraft({ ...notesDraft, [f.id]: e.target.value })} style={{ width: '100%', minHeight: 50, marginBottom: 10, padding: 8, borderRadius: 6, border: `0.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 12.5, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button disabled={actioning === f.id} onClick={() => resolve(f, 'reviewed', { restoreAccess: true })} style={{ padding: '8px 14px', background: GREEN, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Not Victim Info — Restore Access</button>
                <button disabled={actioning === f.id} onClick={() => resolve(f, 'retained_legal_hold')} style={{ padding: '8px 14px', background: WARNING, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Retain (Legal Hold)</button>
                <button disabled={actioning === f.id} onClick={() => resolve(f, 'replaced')} style={{ padding: '8px 14px', background: ACCENT, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Mark Replaced</button>
                <button disabled={actioning === f.id} onClick={() => { if (window.confirm('Permanently delete this record? This cannot be undone.')) resolve(f, 'removed', { deleteRecord: true }); }} style={{ padding: '8px 14px', background: RED, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Securely Remove</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
