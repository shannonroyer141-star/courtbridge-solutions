import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function ContactLog() {
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: '', contact_date: '', contact_type: '', direction: 'Outbound', summary: '', outcome: '' });
  const [saving, setSaving] = useState(false);

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
    await supabase.from('contact_log').insert([form]);
    setForm({ client_id: '', contact_date: '', contact_type: '', direction: 'Outbound', summary: '', outcome: '' });
    setShowForm(false);
    setSaving(false);
    fetchLogs();
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Contact Log</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Log Contact</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="datetime-local" value={form.contact_date} onChange={e => setForm({...form, contact_date: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <select value={form.contact_type} onChange={e => setForm({...form, contact_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Contact Type *</option>
            <option>Phone Call</option><option>In-Person Meeting</option><option>Email</option><option>Text Message</option><option>Court Appearance</option><option>Home Visit</option>
          </select>
          <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option>Outbound</option><option>Inbound</option>
          </select>
          <textarea placeholder="Summary *" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '80px' }} />
          <input placeholder="Outcome / Next steps" value={form.outcome} onChange={e => setForm({...form, outcome: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>{saving ? 'Saving...' : 'Save Log'}</button>
        </div>
      )}
      {logs.length === 0 ? <p style={{ color: '#666' }}>No contacts logged yet.</p> : logs.map(l => (
        <div key={l.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{l.clients?.name || 'Unknown'}</p>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>{l.contact_type} — {l.direction}</p>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#888' }}>{l.contact_date ? new Date(l.contact_date).toLocaleString() : ''}</p>
            </div>
          </div>
          {l.summary && <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#444' }}>{l.summary}</p>}
          {l.outcome && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#27AE60' }}>→ {l.outcome}</p>}
        </div>
      ))}
    </div>
  );
}
