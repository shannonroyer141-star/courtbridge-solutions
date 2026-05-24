import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ program_name: '', program_type: '', duration_weeks: '', frequency: '', description: '', approved_latitude: '', approved_longitude: '', allowed_radius_miles: '0.25' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPrograms(); }, []);

  async function fetchPrograms() {
    const { data } = await supabase.from('programs').select('*').order('name');
    if (data) setPrograms(data);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('programs').insert([form]);
    setForm({ program_name: '', program_type: '', duration_weeks: '', frequency: '', description: '', approved_latitude: '', approved_longitude: '', allowed_radius_miles: '0.25' });
    setShowForm(false);
    setSaving(false);
    fetchPrograms();
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Programs</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Add Program</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <input placeholder="Program Name *" value={form.program_name} onChange={e => setForm({...form, program_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <select value={form.program_type} onChange={e => setForm({...form, program_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Program Type</option>
            <option>BIP (Batterers Intervention)</option><option>DUI</option><option>Drug Court</option><option>Mental Health Court</option><option>Veterans Court</option><option>Anger Management</option><option>Substance Abuse</option><option>Specialty Court</option>
          </select>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input placeholder="Duration (weeks)" value={form.duration_weeks} onChange={e => setForm({...form, duration_weeks: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input placeholder="Frequency" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input placeholder="Approved Latitude" value={form.approved_latitude} onChange={e => setForm({...form, approved_latitude: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input placeholder="Approved Longitude" value={form.approved_longitude} onChange={e => setForm({...form, approved_longitude: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input placeholder="Radius (miles)" value={form.allowed_radius_miles} onChange={e => setForm({...form, allowed_radius_miles: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '70px' }} />
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>{saving ? 'Saving...' : 'Save Program'}</button>
        </div>
      )}
      {programs.length === 0 ? <p style={{ color: '#666' }}>No programs yet.</p> : programs.map(p => (
        <div key={p.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '20px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#1B3A6B' }}>{p.program_name || p.name}</h3>
          {p.program_type && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{p.program_type}</p>}
          {p.duration_weeks && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#888' }}>{p.duration_weeks} weeks • {p.frequency}</p>}
        </div>
      ))}
    </div>
  );
}
