import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, RED, ORANGE, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme';

export default function DrugTests() {
  const [tests, setTests] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: '', test_date: '', result: '', substances_tested: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTests(); fetchClients(); }, []);

  async function fetchTests() {
    const { data } = await supabase.from('drug_tests').select('*, clients(name)').order('test_date', { ascending: false });
    if (data) setTests(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('drug_tests').insert([form]);
    setForm({ client_id: '', test_date: '', result: '', substances_tested: '', notes: '' });
    setShowForm(false);
    setSaving(false);
    fetchTests();
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Drug Tests</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Log Test</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={inputStyle}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={form.test_date} onChange={e => setForm({...form, test_date: e.target.value})} style={inputStyle} />
          <select value={form.result} onChange={e => setForm({...form, result: e.target.value})} style={inputStyle}>
            <option value="">Test Result *</option>
            <option>Negative</option><option>Positive</option><option>Refused</option><option>No Show</option>
          </select>
          <input placeholder="Substances tested" value={form.substances_tested} onChange={e => setForm({...form, substances_tested: e.target.value})} style={inputStyle} />
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Test'}</button>
        </div>
      )}
      {tests.length === 0 ? <p style={{ color: TEXT_MUTED }}>No drug tests logged yet.</p> : tests.map(t => (
        <div key={t.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{t.clients?.name || 'Unknown'}</p>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{t.test_date ? new Date(t.test_date).toLocaleDateString() : ''}</p>
          </div>
          <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 'bold', background: t.result === 'Negative' ? 'rgba(76,175,125,0.15)' : t.result === 'Positive' ? 'rgba(248,113,113,0.15)' : 'rgba(255,140,66,0.15)', color: t.result === 'Negative' ? GREEN : t.result === 'Positive' ? RED : ORANGE }}>{t.result}</span>
        </div>
      ))}
    </div>
  );
}
