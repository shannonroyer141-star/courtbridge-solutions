import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: '', event_type: '', client_name: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    const { data } = await supabase.from('calendar_events').select('*').order('event_date', { ascending: true });
    if (data) setEvents(data);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('calendar_events').insert([form]);
    setForm({ title: '', event_date: '', event_type: '', client_name: '', notes: '' });
    setShowForm(false);
    setSaving(false);
    fetchEvents();
  }

  const typeColors = { 'Court Date': '#E74C3C', 'Check-In Due': '#1B3A6B', 'Appointment': '#27AE60', 'Deadline': '#F39C12', 'Other': '#8e44ad' };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Calendar</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Add Event</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <input placeholder="Event Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input type="datetime-local" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Select Type</option>
            <option>Court Date</option><option>Check-In Due</option><option>Appointment</option><option>Deadline</option><option>Other</option>
          </select>
          <input placeholder="Client Name (optional)" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '70px' }} />
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>{saving ? 'Saving...' : 'Save Event'}</button>
        </div>
      )}
      {events.length === 0 ? <p style={{ color: '#666' }}>No events yet.</p> : events.map(e => (
        <div key={e.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ background: typeColors[e.event_type] || '#888', color: 'white', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{e.event_type || 'Event'}</div>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{e.title}</p>
            {e.client_name && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>Client: {e.client_name}</p>}
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#888' }}>{e.event_date ? new Date(e.event_date).toLocaleString() : ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
