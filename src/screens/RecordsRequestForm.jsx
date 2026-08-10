import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { DARK_BG, CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';

export default function RecordsRequestForm() {
  const [orgs, setOrgs] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    requester_name: '', requester_org_name: '', requester_role: '', requester_email: '', requester_phone: '',
    target_org_id: '', client_name_text: '', scope_requested: '', reason: '',
  });

  useEffect(() => {
    supabase.from('organizations').select('id, organization_name').eq('directory_visible', true).order('organization_name')
      .then(({ data }) => setOrgs(data || []));
  }, []);

  function update(field, value) { setForm(prev => ({ ...prev, [field]: value })); setError(null); }

  async function submit() {
    if (!form.requester_name.trim() || !form.requester_org_name.trim() || !form.requester_email.trim()) { setError('Your name, organization, and email are required.'); return; }
    if (!form.target_org_id) { setError('Select which agency you are requesting records from.'); return; }
    if (!form.client_name_text.trim()) { setError('The client/participant name is required.'); return; }
    if (!form.scope_requested.trim() || !form.reason.trim()) { setError('Please describe what you need and why.'); return; }
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from('records_access_requests').insert([{
      requester_name: form.requester_name, requester_org_name: form.requester_org_name,
      requester_role: form.requester_role, requester_email: form.requester_email, requester_phone: form.requester_phone,
      target_org_id: form.target_org_id, client_name_text: form.client_name_text,
      scope_requested: form.scope_requested, reason: form.reason,
    }]);
    if (err) { setError('Could not submit request: ' + err.message); setSubmitting(false); return; }
    setSubmitting(false);
    setSubmitted(true);
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 14, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14 };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: NAV_FONT }}>
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Request submitted</div>
          <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6 }}>
            The agency has been notified and must review your request before anything is shared. You'll be contacted at the email you provided once a decision is made.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', fontFamily: NAV_FONT }}>
      <div style={{ color: TEXT, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Records Access Request</div>
      <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 28, textAlign: 'center', maxWidth: 420 }}>
        For courts, probation officers, and other authorized parties requesting a client's compliance record. The agency reviews and must approve every request — nothing is shared automatically.
      </div>

      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: 32, width: '100%', maxWidth: 460 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 14 }}>Your Information</div>
        <label style={labelStyle}>Your Name *</label>
        <input style={inputStyle} value={form.requester_name} onChange={e => update('requester_name', e.target.value)} />
        <label style={labelStyle}>Your Organization/Court *</label>
        <input style={inputStyle} value={form.requester_org_name} onChange={e => update('requester_org_name', e.target.value)} placeholder="e.g. 12th Judicial Circuit Court" />
        <label style={labelStyle}>Your Role</label>
        <input style={inputStyle} value={form.requester_role} onChange={e => update('requester_role', e.target.value)} placeholder="e.g. Probation Officer, Court Clerk" />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={form.requester_email} onChange={e => update('requester_email', e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} type="tel" value={form.requester_phone} onChange={e => update('requester_phone', e.target.value)} />
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, margin: '16px 0 14px' }}>What You Need</div>
        <label style={labelStyle}>Which agency are you requesting from? *</label>
        <select style={inputStyle} value={form.target_org_id} onChange={e => update('target_org_id', e.target.value)}>
          <option value="">Select agency...</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.organization_name}</option>)}
        </select>
        {orgs.length === 0 && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: -10, marginBottom: 14 }}>No agencies are listed yet. Contact them directly.</div>}
        <label style={labelStyle}>Client / Participant Name *</label>
        <input style={inputStyle} value={form.client_name_text} onChange={e => update('client_name_text', e.target.value)} />
        <label style={labelStyle}>What are you requesting? *</label>
        <input style={inputStyle} value={form.scope_requested} onChange={e => update('scope_requested', e.target.value)} placeholder="e.g. Last 90 days check-in compliance report" />
        <label style={labelStyle}>Reason *</label>
        <NotesWarning />
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.reason} onChange={e => update('reason', e.target.value)} placeholder="e.g. Upcoming compliance hearing on [date]" />

        {error && <div style={{ color: RED, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <button onClick={submit} disabled={submitting} style={{ width: '100%', padding: 14, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}
