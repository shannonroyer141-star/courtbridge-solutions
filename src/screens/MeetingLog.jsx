import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function MeetingLog() {
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: '', meeting_type: 'AA', meeting_date: '', meeting_time: '', location_name: '', verification_method: 'gps', secretary_name: '', notes: '', verified: false });

  useEffect(() => { fetchMeetings(); fetchClients(); }, []);

  async function fetchMeetings() {
    const { data } = await supabase.from('meeting_log').select('*, clients(name)').order('meeting_date', { ascending: false });
    if (data) setMeetings(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('meeting_log').insert([form]);
    setForm({ client_id: '', meeting_type: 'AA', meeting_date: '', meeting_time: '', location_name: '', verification_method: 'gps', secretary_name: '', notes: '', verified: false });
    setShowForm(false);
    setSaving(false);
    fetchMeetings();
  }

  async function toggleVerified(m) {
    await supabase.from('meeting_log').update({ verified: !m.verified }).eq('id', m.id);
    fetchMeetings();
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Meeting Log</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Log Meeting</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.meeting_type} onChange={e => setForm({...form, meeting_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="AA">AA (Alcoholics Anonymous)</option>
            <option value="NA">NA (Narcotics Anonymous)</option>
            <option value="CA">CA (Cocaine Anonymous)</option>
            <option value="Smart Recovery">SMART Recovery</option>
            <option value="Other">Other Support Group</option>
          </select>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" value={form.meeting_date} onChange={e => setForm({...form, meeting_date: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input type="time" value={form.meeting_time} onChange={e => setForm({...form, meeting_time: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <input placeholder="Location Name" value={form.location_name} onChange={e => setForm({...form, location_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input placeholder="Secretary Name (optional)" value={form.secretary_name} onChange={e => setForm({...form, secretary_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '60px' }} />
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.meeting_date} style={{ width: '100%', padding: '13px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Meeting Record'}</button>
        </div>
      )}
      {meetings.length === 0 ? <p style={{ color: '#666' }}>No meetings logged yet.</p> : meetings.map(m => (
        <div key={m.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{m.clients?.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#333' }}>{m.meeting_type} — {m.location_name}</p>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>{m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : ''}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: m.verified ? '#d4edda' : '#fff3cd', color: m.verified ? '#155724' : '#856404' }}>{m.verified ? '✅ Verified' : '⏳ Pending'}</span>
              {!m.verified && <button onClick={() => toggleVerified(m)} style={{ padding: '5px 12px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Mark Verified</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
