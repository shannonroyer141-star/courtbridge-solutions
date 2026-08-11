import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning, FlagRestrictedButton } from '../components/VictimInfoWarning';

export default function JcxReferrals({ session }) {
  const [referrals, setReferrals] = useState([]);
  const [myOrgId, setMyOrgId] = useState(null);
  const [directoryOrgs, setDirectoryOrgs] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ to_org_id: '', client_id: '', client_name: '', client_contact: '', reason: '', case_summary: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single();
    const orgId = profile?.organization_id || null;
    setMyOrgId(orgId);

    const { data: refs } = await supabase.from('referrals').select('*, from:from_org_id(organization_name), to:to_org_id(organization_name)').order('created_at', { ascending: false });
    setReferrals(refs || []);

    const { data: orgs } = await supabase.from('organizations').select('id, organization_name').eq('directory_visible', true).neq('id', orgId || '');
    setDirectoryOrgs(orgs || []);

    const { data: myClients } = await supabase.from('clients').select('id, name, phone').eq('provider_id', session.user.id).order('name');
    setClients(myClients || []);

    setLoading(false);
  }

  async function sendReferral() {
    if (!form.to_org_id) { setError('Choose which agency to refer to.'); return; }
    if (!form.client_name.trim()) { setError('Client name is required.'); return; }
    if (!form.reason.trim()) { setError('Reason for referral is required.'); return; }
    if (!myOrgId) { setError('Your account is not linked to an organization yet.'); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('referrals').insert([{
      from_org_id: myOrgId, to_org_id: form.to_org_id,
      client_id: form.client_id || null, client_name: form.client_name, client_contact: form.client_contact,
      reason: form.reason, case_summary: form.case_summary, created_by: session.user.id,
    }]);
    if (err) { setError('Could not send referral: ' + err.message); setSaving(false); return; }
    setForm({ to_org_id: '', client_id: '', client_name: '', client_contact: '', reason: '', case_summary: '' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function respond(id, status) {
    const { error: err } = await supabase.from('referrals').update({ status, responded_by: session.user.id, responded_at: new Date().toISOString() }).eq('id', id);
    if (err) { setError('Could not update that referral: ' + err.message); return; }
    load();
  }

  function pickClient(clientId) {
    const c = clients.find(cl => cl.id === clientId);
    setForm(prev => ({ ...prev, client_id: clientId, client_name: c ? c.name : prev.client_name, client_contact: c?.phone || prev.client_contact }));
  }

  const inputStyle = { width: '100%', padding: 11, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14 };
  const statusColor = { pending: WARNING, accepted: GREEN, declined: RED };

  if (loading) return <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading referrals...</div>;

  const incoming = referrals.filter(r => r.to_org_id === myOrgId);
  const outgoing = referrals.filter(r => r.from_org_id === myOrgId);

  return (
    <div style={{ padding: 30, maxWidth: 820, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Cross-Agency Referrals</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Refer a Client'}
        </button>
      </div>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 20, fontSize: 14 }}>Send a client to another agency for a program or specialty you don't offer. Only what you write here is shared — nothing pulls from their record automatically.</p>

      {error && !showForm && <div style={{ color: RED, fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${ACCENT}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Refer To *</label>
          <select style={inputStyle} value={form.to_org_id} onChange={e => setForm({ ...form, to_org_id: e.target.value })}>
            <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select agency from directory...</option>
            {directoryOrgs.map(o => <option key={o.id} value={o.id} style={{ background: '#1E2A3A', color: '#fff' }}>{o.organization_name}</option>)}
          </select>
          {directoryOrgs.length === 0 && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: -8, marginBottom: 12 }}>No other agencies are in the directory yet — check the Agency Directory tab.</div>}

          <label style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Client</label>
          <select style={inputStyle} value={form.client_id} onChange={e => pickClient(e.target.value)}>
            <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select one of your clients (optional)...</option>
            {clients.map(c => <option key={c.id} value={c.id} style={{ background: '#1E2A3A', color: '#fff' }}>{c.name}</option>)}
          </select>
          <input style={inputStyle} placeholder="Client Name *" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
          <input style={inputStyle} placeholder="Client Contact (phone/email)" value={form.client_contact} onChange={e => setForm({ ...form, client_contact: e.target.value })} />
          <NotesWarning />
          <textarea style={{ ...inputStyle, minHeight: 50 }} placeholder="Reason for referral *" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="Case summary — only what you choose to write here is sent" value={form.case_summary} onChange={e => setForm({ ...form, case_summary: e.target.value })} />
          {error && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button onClick={sendReferral} disabled={saving} style={{ padding: '10px 20px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Sending...' : 'Send Referral'}
          </button>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10 }}>Incoming ({incoming.length})</div>
      {incoming.length === 0 ? <div style={{ color: TEXT_DIM, fontSize: 13, marginBottom: 20 }}>No incoming referrals.</div> : incoming.map(r => (
        <div key={r.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.client_name} — from {r.from?.organization_name || 'Unknown agency'}</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: statusColor[r.status] }}>{r.status.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 8 }}><strong>Reason:</strong> {r.reason}</div>
          {r.case_summary && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}><strong>Summary:</strong> {r.case_summary}</div>}
          {r.client_contact && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 4 }}>Contact: {r.client_contact}</div>}
          {r.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => respond(r.id, 'accepted')} style={{ padding: '7px 14px', background: 'rgba(76,175,125,0.15)', color: GREEN, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Accept</button>
              <button onClick={() => respond(r.id, 'declined')} style={{ padding: '7px 14px', background: 'rgba(248,113,113,0.12)', color: RED, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Decline</button>
            </div>
          )}
          <div style={{ marginTop: 8 }}><FlagRestrictedButton tableName="referrals" recordId={r.id} onFlagged={load} /></div>
        </div>
      ))}

      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, margin: '20px 0 10px' }}>Sent by You ({outgoing.length})</div>
      {outgoing.length === 0 ? <div style={{ color: TEXT_DIM, fontSize: 13 }}>No referrals sent yet.</div> : outgoing.map(r => (
        <div key={r.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{r.client_name} — to {r.to?.organization_name || 'Unknown agency'}</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: statusColor[r.status] }}>{r.status.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 8 }}>{r.reason}</div>
          <div style={{ marginTop: 8 }}><FlagRestrictedButton tableName="referrals" recordId={r.id} onFlagged={load} /></div>
        </div>
      ))}
    </div>
  );
}
