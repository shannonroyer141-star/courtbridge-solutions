import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ program_name: '', program_type: '', duration_weeks: '', frequency: '', description: '', approved_latitude: '', approved_longitude: '', allowed_radius_miles: '0.25' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { fetchPrograms(); }, []);

  async function fetchPrograms() {
    const { data } = await supabase.from('programs').select('*').order('program_name');
    if (data) setPrograms(data);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...form,
      provider_id: user.id,
      duration_weeks: form.duration_weeks ? parseInt(form.duration_weeks, 10) : null,
      approved_latitude: form.approved_latitude ? parseFloat(form.approved_latitude) : null,
      approved_longitude: form.approved_longitude ? parseFloat(form.approved_longitude) : null,
      allowed_radius_miles: form.allowed_radius_miles ? parseFloat(form.allowed_radius_miles) : null,
    };
    const { error } = await supabase.from('programs').insert([payload]);
    if (error) {
      setSaveError('Could not save program: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ program_name: '', program_type: '', duration_weeks: '', frequency: '', description: '', approved_latitude: '', approved_longitude: '', allowed_radius_miles: '0.25' });
    setShowForm(false);
    setSaving(false);
    fetchPrograms();
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Programs</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Program</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <input placeholder="Program Name *" value={form.program_name} onChange={e => setForm({...form, program_name: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <select value={form.program_type} onChange={e => setForm({...form, program_type: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="">Program Type</option>
            <option>BIP (Batterers Intervention)</option><option>DUI</option><option>Drug Court</option><option>Mental Health Court</option><option>Veterans Court</option><option>Anger Management</option><option>Substance Abuse</option><option>Specialty Court</option>
          </select>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="Duration (weeks)" value={form.duration_weeks} onChange={e => setForm({...form, duration_weeks: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
            <input placeholder="Frequency" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="Approved Latitude" value={form.approved_latitude} onChange={e => setForm({...form, approved_latitude: e.target.value})} style={{ flex: 1, minWidth: 120, ...inputStyle }} />
            <input placeholder="Approved Longitude" value={form.approved_longitude} onChange={e => setForm({...form, approved_longitude: e.target.value})} style={{ flex: 1, minWidth: 120, ...inputStyle }} />
            <input placeholder="Radius (miles)" value={form.allowed_radius_miles} onChange={e => setForm({...form, allowed_radius_miles: e.target.value})} style={{ flex: 1, minWidth: 120, ...inputStyle }} />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ width: '100%', minHeight: 70, marginBottom: 15, ...inputStyle }} />
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Program'}</button>
        </div>
      )}
      {programs.length === 0 ? <p style={{ color: TEXT_MUTED }}>No programs yet.</p> : programs.map(p => (
        <div key={p.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 20, marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: TEXT }}>{p.program_name || p.name}</h3>
          {p.program_type && <p style={{ margin: '4px 0 0', fontSize: 13, color: TEXT_MUTED }}>{p.program_type}</p>}
          {p.duration_weeks && <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_DIM }}>{p.duration_weeks} weeks • {p.frequency}</p>}
        </div>
      ))}
    </div>
  );
}
