import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function POVisits() {
  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: '', visit_date: '', visit_time: '', visit_type: 'In-Person', po_name: '', po_agency: '', po_phone: '', location: '', outcome: '', next_visit_date: '', notes: '', status: 'completed' });

  useEffect(() => { fetchVisits(); fetchClients(); }, []);

  async function fetchVisits() {
    const { data } = await supabase.from('po_visits').select('*, clients(name)').order('visit_date', { ascending: false });
    if (data) setVisits(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('po_visits').insert([form]);
    setForm({ client_id: '', visit_date: '', visit_time: '', visit_type: 'In-Person', po_name: '', po_agency: '', po_phone: '', location: '', outcome: '', next_visit_date: '', notes: '', status: 'completed' });
    setShowForm(false);
    setSaving(false);
    fetchVisits();
  }

  const statusColors = { completed: { bg: '#d4edda', color: '#155724', label: '✅ Completed' }, missed: { bg: '#f8d7da', color: '#721c24', label: '🚫 Missed' }, upcoming: { bg: '#e8f0fb', color: '#1B3A6B', label: '📅 Upcoming' }, rescheduled: { bg: '#fff3cd', color: '#856404', label: '🔄 Rescheduled' }, excused: { bg: '#cce5ff', color: '#004085', label: '📋 Excused' } };

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>PO Visits</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Log Visit</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="completed">Completed</option><option value="upcoming">Upcoming</option><option value="missed">Missed</option><option value="rescheduled">Rescheduled</option><option value="excused">Excused</option>
          </select>
          <select value={form.visit_type} onChange={e => setForm({...form, visit_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option>In-Person</option><option>Phone Check-In</option><option>Virtual / Video</option><option>Home Visit</option><option>Office Visit</option>
          </select>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" value={form.visit_date} onChange={e => setForm({...form, visit_date: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input type="time" value={form.visit_time} onChange={e => setForm({...form, visit_time: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <input placeholder="PO Name" value={form.po_name} onChange={e => setForm({...form, po_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input placeholder="PO Agency" value={form.po_agency} onChange={e => setForm({...form, po_agency: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '60px' }} />
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.visit_date} style={{ width: '100%', padding: '13px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Visit Record'}</button>
        </div>
      )}
      {visits.length === 0 ? <p style={{ color: '#666' }}>No visits logged yet.</p> : visits.map(v => {
        const s = statusColors[v.status] || statusColors.completed;
        return (
          <div key={v.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{v.clients?.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#333' }}>{v.visit_type}</p>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : ''}</p>
                {v.po_name && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>PO: {v.po_name}</p>}
              </div>
              <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
