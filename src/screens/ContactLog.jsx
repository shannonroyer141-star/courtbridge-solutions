import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning, FlagRestrictedButton } from '../components/VictimInfoWarning';

export default function ContactLog() {
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: '', contact_date: '', contact_type: '', direction: 'Outbound', summary: '', outcome: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { fetchLogs(); fetchClients(); }, []);

  async function fetchLogs() {
    const { data } = await supabase.from('contact_log').select('*, clients(name)').order('contact_date', { ascending: false });
    if (data) setLogs(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('contact_log').insert([{ ...form, provider_id: user.id }]);
    if (error) {
      setSaveError('Could not save log: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ client_id: '', contact_date: '', contact_type: '', direction: 'Outbound', summary: '', outcome: '' });
    setShowForm(false);
    setSaving(false);
    fetchLogs();
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Contact Log</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Log Contact</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={inputStyle}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="datetime-local" value={form.contact_date} onChange={e => setForm({...form, contact_date: e.target.value})} style={inputStyle} />
          <select value={form.contact_type} onChange={e => setForm({...form, contact_type: e.target.value})} style={inputStyle}>
            <option value="">Contact Type *</option>
            <option>Phone Call</option><option>In-Person Meeting</option><option>Email</option><option>Text Message</option><option>Court Appearance</option><option>Home Visit</option>
          </select>
          <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} style={inputStyle}>
            <option>Outbound</option><option>Inbound</option>
          </select>
          <NotesWarning />
          <textarea placeholder="Summary *" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} style={{ ...inputStyle, minHeight: 80 }} />
          <input placeholder="Outcome / Next steps" value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} style={{ ...inputStyle, marginBottom: 15 }} />
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Log'}</button>
        </div>
      )}
      {logs.length === 0 ? <p style={{ color: TEXT_MUTED }}>No contacts logged yet.</p> : logs.map(l => (
        <div key={l.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{l.clients?.name || 'Unknown'}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{l.contact_type} — {l.direction}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_DIM }}>{l.contact_date ? new Date(l.contact_date).toLocaleString() : ''}</p>
            </div>
          </div>
          {l.summary && <p style={{ margin: '8px 0 0', fontSize: 14, color: TEXT }}>{l.summary}</p>}
          {l.outcome && <p style={{ margin: '4px 0 0', fontSize: 13, color: GREEN }}>→ {l.outcome}</p>}
          <div style={{ marginTop: 8 }}><FlagRestrictedButton tableName="contact_log" recordId={l.id} clientId={l.client_id} onFlagged={fetchLogs} /></div>
        </div>
      ))}
    </div>
  );
}
