import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const TYPES = {
  case_note: { label: 'Case Note', table: 'case_notes', ownerField: 'provider_id', color: '#5B9BF0' },
  clinical_note: { label: 'Clinical Note', table: 'clinical_notes', ownerField: 'provider_id', color: '#1B3A6B' },
  legal_agreement: { label: 'Legal Agreement', table: 'legal_agreements', ownerField: 'user_id', color: '#7DA6E0' },
};

export default function SensitiveNotes() {
  const [type, setType] = useState('case_note');
  const [entries, setEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ client_id: '', title: '', content: '', entry_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => { fetchEntries(); setShowForm(false); setStatus(''); }, [type]);

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function fetchEntries() {
    const { data, error } = await supabase.from(TYPES[type].table).select('*, clients(name)').order('created_at', { ascending: false });
    if (error) { setStatus('Could not load — this table may need its columns confirmed. ' + error.message); setEntries([]); return; }
    setEntries(data || []);
  }

  async function handleSave() {
    if (!form.client_id || !form.content) { setStatus('Please select a client and enter content.'); return; }
    setSaving(true); setStatus('');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from(TYPES[type].table).insert([{
      client_id: form.client_id,
      title: form.title || null,
      content: form.content,
      entry_date: form.entry_date,
      [TYPES[type].ownerField]: user.id,
    }]);
    if (error) {
      setStatus('Save failed — the table columns likely need adjusting once Supabase is reachable. ' + error.message);
    } else {
      setForm({ client_id: '', title: '', content: '', entry_date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      fetchEntries();
    }
    setSaving(false);
  }

  const color = TYPES[type].color;
  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <div style={{ background: 'rgba(61,111,168,0.12)', border: `0.5px solid ${WARNING}`, borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: WARNING }}>
        🔒 Sensitive records — restricted, client-identifying information. Access should be limited to authorized staff.
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Case &amp; Clinical Notes</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: color, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ New Entry</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {Object.entries(TYPES).map(([key, t]) => (
          <button key={key} onClick={() => setType(key)}
            style={{ padding: '8px 16px', background: type === key ? t.color : 'rgba(255,255,255,0.04)', color: type === key ? 'white' : t.color, border: `0.5px solid ${t.color}`, borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {status && <div style={{ background: 'rgba(248,113,113,0.1)', border: `0.5px solid ${RED}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: RED }}>{status}</div>}

      {showForm && (
        <div style={{ background: CARD_BG, border: `1px solid ${color}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} style={inputStyle}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} style={inputStyle} />
          <input placeholder="Title (optional)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <textarea placeholder={`${TYPES[type].label} content *`} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ ...inputStyle, minHeight: 140 }} />
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 13, background: color, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>{saving ? 'Saving...' : `Save ${TYPES[type].label}`}</button>
        </div>
      )}

      {TYPES[type].comingSoon ? null : entries.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No {TYPES[type].label.toLowerCase()}s yet.</p>
      ) : entries.map(e => (
        <div key={e.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderLeft: `4px solid ${color}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{e.clients?.name || 'Unknown'}</p>
          {e.title && <p style={{ margin: '3px 0 0', fontWeight: 600, color: TEXT }}>{e.title}</p>}
          <p style={{ margin: '6px 0 0', fontSize: 14, color: TEXT, whiteSpace: 'pre-wrap' }}>{e.content}</p>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: TEXT_DIM }}>{e.entry_date ? new Date(e.entry_date).toLocaleDateString() : ''}</p>
        </div>
      ))}
    </div>
  );
}
