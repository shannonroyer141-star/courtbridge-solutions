import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, ORANGE, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

export default function CourtDates() {
  const [hearings, setHearings] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
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
    setSaveError(null);
    const { error } = await supabase.from('court_dates').insert([form]);
    if (error) {
      setSaveError('Could not save hearing: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ client_id: '', hearing_type: '', hearing_date: '', hearing_time: '', court_name: '', courtroom: '', judge_name: '', attorney_name: '', documents_required: '', notes: '', status: 'upcoming' });
    setShowForm(false);
    setSaving(false);
    fetchHearings();
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  const daysUntil = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  const urgencyColor = (date) => { const d = daysUntil(date); return d <= 3 ? RED : d <= 7 ? ORANGE : GREEN; };
  const upcoming = hearings.filter(h => h.status === 'upcoming');
  const past = hearings.filter(h => h.status === 'completed');

  return (
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Court Dates</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Hearing</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.hearing_type} onChange={e => setForm({...form, hearing_type: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="">Hearing Type *</option>
            <option>Status Hearing</option><option>Review Hearing</option><option>Disposition Hearing</option><option>Arraignment</option><option>Sentencing</option><option>Violation of Probation</option><option>Drug Court Review</option><option>Dependency Hearing</option><option>Permanency Hearing</option><option>Other</option>
          </select>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="date" value={form.hearing_date} onChange={e => setForm({...form, hearing_date: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
            <input type="time" value={form.hearing_time} onChange={e => setForm({...form, hearing_time: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
          </div>
          <input placeholder="Court Name" value={form.court_name} onChange={e => setForm({...form, court_name: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="Courtroom" value={form.courtroom} onChange={e => setForm({...form, courtroom: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
            <input placeholder="Judge Name" value={form.judge_name} onChange={e => setForm({...form, judge_name: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
          </div>
          <textarea placeholder="Documents required" value={form.documents_required} onChange={e => setForm({...form, documents_required: e.target.value})} style={{ width: '100%', minHeight: 60, marginBottom: 15, ...inputStyle }} />
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.hearing_date} style={{ width: '100%', padding: 13, background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Hearing'}</button>
        </div>
      )}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: TEXT, marginBottom: 12, fontSize: 16 }}>Upcoming Hearings</h2>
          {upcoming.map(h => (
            <div key={h.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderLeft: `4px solid ${urgencyColor(h.hearing_date)}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{h.clients?.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 14, color: TEXT }}>{h.hearing_type}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{new Date(h.hearing_date).toLocaleDateString()} {h.hearing_time || ''}</p>
                  {h.court_name && <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{h.court_name}</p>}
                  {h.documents_required && <div style={{ marginTop: 8, background: 'rgba(255,140,66,0.12)', borderRadius: 6, padding: '8px 12px' }}><p style={{ margin: 0, fontSize: 12, color: ORANGE }}>Documents needed: {h.documents_required}</p></div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: urgencyColor(h.hearing_date), fontSize: 16 }}>{daysUntil(h.hearing_date)}d</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_DIM }}>away</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h2 style={{ color: TEXT_MUTED, marginBottom: 12, fontSize: 16 }}>Past Hearings</h2>
          {past.map(h => (
            <div key={h.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 8, opacity: 0.8 }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT_MUTED }}>{h.clients?.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_DIM }}>{h.hearing_type} — {new Date(h.hearing_date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
      {hearings.length === 0 && <p style={{ color: TEXT_MUTED }}>No court dates yet.</p>}
    </div>
  );
}
