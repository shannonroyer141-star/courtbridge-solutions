import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const COMMON_PROGRAMS = [
  { program_name: 'Batterers Intervention Program (BIP)', program_type: 'BIP (Batterers Intervention)', duration_weeks: 26, frequency: 'Weekly', description: 'State-certified intervention program for domestic violence offenders.' },
  { program_name: 'DUI/DWI Education Program', program_type: 'DUI', duration_weeks: 12, frequency: 'Weekly', description: 'Court-ordered education and monitoring for DUI/DWI offenses.' },
  { program_name: 'Drug Court', program_type: 'Drug Court', duration_weeks: 52, frequency: 'Weekly + random testing', description: 'Intensive supervision, treatment, and frequent drug testing in lieu of incarceration.' },
  { program_name: 'Mental Health Court', program_type: 'Mental Health Court', duration_weeks: 52, frequency: 'Biweekly', description: 'Supervision and treatment coordination for defendants with mental health diagnoses.' },
  { program_name: 'Veterans Treatment Court', program_type: 'Veterans Court', duration_weeks: 52, frequency: 'Biweekly', description: 'Treatment-focused docket for justice-involved veterans, often paired with VA services.' },
  { program_name: 'Anger Management', program_type: 'Anger Management', duration_weeks: 12, frequency: 'Weekly', description: 'Short-term cognitive-behavioral program addressing anger-related offenses.' },
  { program_name: 'Substance Abuse Treatment', program_type: 'Substance Abuse', duration_weeks: 16, frequency: 'Weekly', description: 'Outpatient substance use treatment and compliance monitoring.' },
  { program_name: 'Domestic Violence Victim-Offender Program', program_type: 'Specialty Court', duration_weeks: 26, frequency: 'Weekly', description: 'Combined intervention and monitoring track for domestic violence cases.' },
  { program_name: 'Probation Compliance Monitoring', program_type: 'Specialty Court', duration_weeks: null, frequency: 'Ongoing', description: 'General check-in and compliance monitoring for standard probation terms.' },
  { program_name: 'Reentry / Reintegration Program', program_type: 'Specialty Court', duration_weeks: 26, frequency: 'Weekly', description: 'Support and monitoring for individuals reentering the community post-incarceration.' },
];

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showCommon, setShowCommon] = useState(false);
  const [selectedCommon, setSelectedCommon] = useState([]);
  const [seeding, setSeeding] = useState(false);
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

  function toggleCommon(name) {
    setSelectedCommon(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  async function handleSeedCommon() {
    setSeeding(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const existingNames = new Set(programs.map(p => p.program_name || p.name));
    const toInsert = COMMON_PROGRAMS
      .filter(p => selectedCommon.includes(p.program_name) && !existingNames.has(p.program_name))
      .map(p => ({ ...p, provider_id: user.id, allowed_radius_miles: 0.25 }));
    if (toInsert.length === 0) {
      setSeeding(false);
      setShowCommon(false);
      setSelectedCommon([]);
      return;
    }
    const { error } = await supabase.from('programs').insert(toInsert);
    if (error) {
      setSaveError('Could not add programs: ' + error.message);
      setSeeding(false);
      return;
    }
    setSeeding(false);
    setShowCommon(false);
    setSelectedCommon([]);
    fetchPrograms();
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Programs</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setShowCommon(!showCommon); setShowForm(false); }} style={{ padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Common Programs</button>
          <button onClick={() => { setShowForm(!showForm); setShowCommon(false); }} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Custom Program</button>
        </div>
      </div>
      {showCommon && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <p style={{ margin: '0 0 16px', color: TEXT_MUTED, fontSize: 13.5 }}>Pick from common specialty-court program types. Duration and frequency are pre-filled with typical defaults — edit any program afterward to match your organization exactly.</p>
          {COMMON_PROGRAMS.map(p => {
            const already = programs.some(existing => (existing.program_name || existing.name) === p.program_name);
            return (
              <label key={p.program_name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, cursor: already ? 'default' : 'pointer', opacity: already ? 0.5 : 1 }}>
                <input type="checkbox" disabled={already} checked={selectedCommon.includes(p.program_name)} onChange={() => toggleCommon(p.program_name)} style={{ marginTop: 3 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{p.program_name} {already && <span style={{ fontWeight: 400, color: TEXT_DIM, fontSize: 12 }}>(already added)</span>}</div>
                  <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 2 }}>{p.duration_weeks ? `${p.duration_weeks} weeks • ` : ''}{p.frequency}</div>
                </div>
              </label>
            );
          })}
          {saveError && <div style={{ color: RED, fontSize: 13, margin: '12px 0 0' }}>{saveError}</div>}
          <button onClick={handleSeedCommon} disabled={seeding || selectedCommon.length === 0} style={{ marginTop: 16, padding: '12px 25px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, opacity: selectedCommon.length === 0 ? 0.6 : 1 }}>
            {seeding ? 'Adding...' : `Add ${selectedCommon.length || ''} Program${selectedCommon.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}
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
