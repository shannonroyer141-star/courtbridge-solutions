import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Drug Tests</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Log Test</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="date" value={form.test_date} onChange={e => setForm({...form, test_date: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <select value={form.result} onChange={e => setForm({...form, result: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Test Result *</option>
            <option>Negative</option><option>Positive</option><option>Refused</option><option>No Show</option>
          </select>
          <input placeholder="Substances tested" value={form.substances_tested} onChange={e => setForm({...form, substances_tested: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>{saving ? 'Saving...' : 'Save Test'}</button>
        </div>
      )}
      {tests.length === 0 ? <p style={{ color: '#666' }}>No drug tests logged yet.</p> : tests.map(t => (
        <div key={t.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{t.clients?.name || 'Unknown'}</p>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>{t.test_date ? new Date(t.test_date).toLocaleDateString() : ''}</p>
          </div>
          <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', background: t.result === 'Negative' ? '#d4edda' : t.result === 'Positive' ? '#f8d7da' : '#fff3cd', color: t.result === 'Negative' ? '#155724' : t.result === 'Positive' ? '#721c24' : '#856404' }}>{t.result}</span>
        </div>
      ))}
    </div>
  );
}
