import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function CourtDates() {
  const [hearings, setHearings] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: '', hearing_type: '', hearing_date: '', hearing_time: '', court_name: '', courtroom: '', judge_name: '', attorney_name: '', documents_required: '', notes: '', status: 'upcoming' });

  useEffect(() => { fetchHearings(); fetchClients(); }, []);

  async function fetchHearings() {
    const { data } = await supabase.from('court_dates').select('*, clients(name)').order('hearing_date', { ascending: true });
    if (data) setHearings(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('court_dates').insert([form]);
    setForm({ client_id: '', hearing_type: '', hearing_date: '', hearing_time: '', court_name: '', courtroom: '', judge_name: '', attorney_name: '', documents_required: '', notes: '', status: 'upcoming' });
    setShowForm(false);
    setSaving(false);
    fetchHearings();
  }

  const daysUntil = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  const urgencyColor = (date) => { const d = daysUntil(date); return d <= 3 ? '#E74C3C' : d <= 7 ? '#F39C12' : '#27AE60'; };
  const upcoming = hearings.filter(h => h.status === 'upcoming');
  const past = hearings.filter(h => h.status === 'completed');

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Court Dates</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Add Hearing</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.hearing_type} onChange={e => setForm({...form, hearing_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Hearing Type *</option>
            <option>Status Hearing</option><option>Review Hearing</option><option>Disposition Hearing</option><option>Arraignment</option><option>Sentencing</option><option>Violation of Probation</option><option>Drug Court Review</option><option>Dependency Hearing</option><option>Permanency Hearing</option><option>Other</option>
          </select>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" value={form.hearing_date} onChange={e => setForm({...form, hearing_date: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input type="time" value={form.hearing_time} onChange={e => setForm({...form, hearing_time: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <input placeholder="Court Name" value={form.court_name} onChange={e => setForm({...form, court_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input placeholder="Courtroom" value={form.courtroom} onChange={e => setForm({...form, courtroom: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input placeholder="Judge Name" value={form.judge_name} onChange={e => setForm({...form, judge_name: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <textarea placeholder="Documents required" value={form.documents_required} onChange={e => setForm({...form, documents_required: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '60px' }} />
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.hearing_date} style={{ width: '100%', padding: '13px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Hearing'}</button>
        </div>
      )}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1B3A6B', marginBottom: '12px', fontSize: '16px' }}>Upcoming Hearings</h2>
          {upcoming.map(h => (
            <div key={h.id} style={{ background: 'white', border: `1px solid ${urgencyColor(h.hearing_date)}40`, borderLeft: `4px solid ${urgencyColor(h.hearing_date)}`, borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{h.clients?.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#333' }}>{h.hearing_type}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#555' }}>{new Date(h.hearing_date).toLocaleDateString()} {h.hearing_time || ''}</p>
                  {h.court_name && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>{h.court_name}</p>}
                  {h.documents_required && <div style={{ marginTop: '8px', background: '#fff3cd', borderRadius: '6px', padding: '8px 12px' }}><p style={{ margin: 0, fontSize: '12px', color: '#856404' }}>Documents needed: {h.documents_required}</p></div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: urgencyColor(h.hearing_date), fontSize: '16px' }}>{daysUntil(h.hearing_date)}d</p>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>away</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 style={{ color: '#888', marginBottom: '12px', fontSize: '16px' }}>Past Hearings</h2>
          {past.map(h => (
            <div key={h.id} style={{ background: 'white', border: '1px solid #eee', borderRadius: '10px', padding: '14px', marginBottom: '8px', opacity: 0.8 }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#555' }}>{h.clients?.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#777' }}>{h.hearing_type} — {new Date(h.hearing_date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
      {hearings.length === 0 && <p style={{ color: '#666' }}>No court dates yet.</p>}
    </div>
  );
}
