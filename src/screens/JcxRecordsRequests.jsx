import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { FlagRestrictedButton } from '../components/VictimInfoWarning';

const fieldLabel = { display: 'block', fontSize: 12, color: TEXT_MUTED, margin: '10px 0 4px' };
const fieldInput = { width: '100%', boxSizing: 'border-box', padding: 9, borderRadius: 6, border: `0.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 13, marginBottom: 8 };

export default function JcxRecordsRequests({ session }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [decideError, setDecideError] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});

  function reviewFor(id) {
    return reviewDrafts[id] || { consentObtained: '', consentDetails: '', legalAuthorityType: '', legalAuthorityDetails: '', part2Applies: '', minimumNecessary: '', approverAttestation: false };
  }
  function updateReview(id, patch) {
    setReviewDrafts(prev => ({ ...prev, [id]: { ...reviewFor(id), ...patch } }));
  }
  function canApprove(id) {
    const r = reviewFor(id);
    return r.consentObtained !== '' && r.legalAuthorityType !== '' && r.part2Applies !== '' && r.minimumNecessary.trim() && r.approverAttestation;
  }

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
    const payload = {
      status, decided_by: session.user.id, decided_at: new Date().toISOString(),
      decision_note: noteDrafts[id] || null,
    };
    if (status === 'approved') {
      const r = reviewFor(id);
      Object.assign(payload, {
        consent_obtained: r.consentObtained === 'yes', consent_details: r.consentDetails || null,
        legal_authority_type: r.legalAuthorityType, legal_authority_details: r.legalAuthorityDetails || null,
        part2_applies: r.part2Applies === 'yes', minimum_necessary_description: r.minimumNecessary,
        approver_attestation: r.approverAttestation,
      });
    }
    const { data, error } = await supabase.from('records_access_requests').update(payload).eq('id', id).select();
    setDecidingId(null);
    if (error) { setDecideError('That decision was not saved: ' + error.message); return; }
    if (!data || data.length === 0) { setDecideError("That decision was not saved — you may not have permission to decide on this request. Approving or denying a records disclosure requires an org admin or founder account."); return; }
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
        Courts, probation officers, or other agencies can request access to one of your client's compliance records. CourtBridge never interprets or decides a request on its own — approving one requires an org admin or founder to answer the required review questions below and personally attest to the decision. Nothing is shared until then, and every decision is logged.
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

          <div style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 14, marginTop: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: TEXT_MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Disclosure Review — required before approval</p>

            <label style={fieldLabel}>Is there valid participant consent for this disclosure?</label>
            <select value={reviewFor(r.id).consentObtained} onChange={e => updateReview(r.id, { consentObtained: e.target.value })} style={fieldInput}>
              <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select...</option><option value="yes" style={{ background: '#1E2A3A', color: '#fff' }}>Yes</option><option value="no" style={{ background: '#1E2A3A', color: '#fff' }}>No</option>
            </select>
            {reviewFor(r.id).consentObtained === 'yes' && (
              <input placeholder="Reference (form, date signed, etc.)" value={reviewFor(r.id).consentDetails} onChange={e => updateReview(r.id, { consentDetails: e.target.value })} style={fieldInput} />
            )}

            <label style={fieldLabel}>Is there a qualifying court order or other legal authority?</label>
            <select value={reviewFor(r.id).legalAuthorityType} onChange={e => updateReview(r.id, { legalAuthorityType: e.target.value })} style={fieldInput}>
              <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select...</option>
              <option value="court_order" style={{ background: '#1E2A3A', color: '#fff' }}>Court order</option>
              <option value="subpoena" style={{ background: '#1E2A3A', color: '#fff' }}>Subpoena</option>
              <option value="statute" style={{ background: '#1E2A3A', color: '#fff' }}>Statutory requirement</option>
              <option value="participant_consent_only" style={{ background: '#1E2A3A', color: '#fff' }}>Consent only, no separate legal order</option>
              <option value="other" style={{ background: '#1E2A3A', color: '#fff' }}>Other</option>
              <option value="none" style={{ background: '#1E2A3A', color: '#fff' }}>None</option>
            </select>
            {reviewFor(r.id).legalAuthorityType && reviewFor(r.id).legalAuthorityType !== 'none' && (
              <input placeholder="Details (case/order number, date, etc.)" value={reviewFor(r.id).legalAuthorityDetails} onChange={e => updateReview(r.id, { legalAuthorityDetails: e.target.value })} style={fieldInput} />
            )}

            <label style={fieldLabel}>Does 42 CFR Part 2 apply to this participant's records?</label>
            <select value={reviewFor(r.id).part2Applies} onChange={e => updateReview(r.id, { part2Applies: e.target.value })} style={fieldInput}>
              <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select...</option><option value="yes" style={{ background: '#1E2A3A', color: '#fff' }}>Yes</option><option value="no" style={{ background: '#1E2A3A', color: '#fff' }}>No</option>
            </select>

            <label style={fieldLabel}>What is the minimum information that lawfully fulfills this request?</label>
            <textarea placeholder="Describe exactly what you're releasing -- it may be narrower than what was requested" value={reviewFor(r.id).minimumNecessary} onChange={e => updateReview(r.id, { minimumNecessary: e.target.value })} style={{ ...fieldInput, minHeight: 60 }} />

            <textarea
              placeholder="Optional note for your records"
              value={noteDrafts[r.id] || ''}
              onChange={e => setNoteDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
              style={{ ...fieldInput, minHeight: 44 }}
            />

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: TEXT, marginTop: 4, cursor: 'pointer' }}>
              <input type="checkbox" checked={reviewFor(r.id).approverAttestation} onChange={e => updateReview(r.id, { approverAttestation: e.target.checked })} style={{ marginTop: 2 }} />
              <span>I am the provider or an authorized privacy/legal representative for this organization, and I am personally approving this specific disclosure.</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => decide(r.id, 'approved')} disabled={decidingId === r.id || !canApprove(r.id)} title={!canApprove(r.id) ? 'Answer every review question above first' : ''} style={{ padding: '8px 16px', background: canApprove(r.id) ? 'rgba(76,175,125,0.15)' : 'rgba(255,255,255,0.06)', color: canApprove(r.id) ? GREEN : TEXT_DIM, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: canApprove(r.id) ? 'pointer' : 'default' }}>
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
          {r.status === 'approved' && (
            <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 6, lineHeight: 1.6 }}>
              Consent: {r.consent_obtained ? 'Yes' : 'No'} · Legal authority: {r.legal_authority_type || '—'} · 42 CFR Part 2 applies: {r.part2_applies ? 'Yes' : 'No'}
              {r.minimum_necessary_description && <div>Released: {r.minimum_necessary_description}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
