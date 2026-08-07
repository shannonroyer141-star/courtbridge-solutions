import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme';
import { NotesWarning, FlagRestrictedButton } from '../components/VictimInfoWarning';

export default function POVisits() {
  const [visits, setVisits] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
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
    setSaveError(null);
    const { error } = await supabase.from('po_visits').insert([form]);
    if (error) {
      setSaveError('Could not save visit: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ client_id: '', visit_date: '', visit_time: '', visit_type: 'In-Person', po_name: '', po_agency: '', po_phone: '', location: '', outcome: '', next_visit_date: '', notes: '', status: 'completed' });
    setShowForm(false);
    setSaving(false);
    fetchVisits();
  }

  const statusColors = {
    completed: { bg: 'rgba(76,175,125,0.15)', color: GREEN, label: '✅ Completed' },
    missed: { bg: 'rgba(248,113,113,0.15)', color: RED, label: '🚫 Missed' },
    upcoming: { bg: 'rgba(91,155,240,0.15)', color: ACCENT, label: '📅 Upcoming' },
    rescheduled: { bg: 'rgba(61,111,168,0.15)', color: WARNING, label: '🔄 Rescheduled' },
    excused: { bg: 'rgba(91,155,240,0.15)', color: ACCENT, label: '📋 Excused' },
  };

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>PO Visits</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Log Visit</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="completed">Completed</option><option value="upcoming">Upcoming</option><option value="missed">Missed</option><option value="rescheduled">Rescheduled</option><option value="excused">Excused</option>
          </select>
          <select value={form.visit_type} onChange={e => setForm({...form, visit_type: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option>In-Person</option><option>Phone Check-In</option><option>Virtual / Video</option><option>Home Visit</option><option>Office Visit</option>
          </select>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="date" value={form.visit_date} onChange={e => setForm({...form, visit_date: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
            <input type="time" value={form.visit_time} onChange={e => setForm({...form, visit_time: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
          </div>
          <input placeholder="PO Name" value={form.po_name} onChange={e => setForm({...form, po_name: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <input placeholder="PO Agency" value={form.po_agency} onChange={e => setForm({...form, po_agency: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <NotesWarning />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', minHeight: 60, marginBottom: 15, ...inputStyle }} />
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.visit_date} style={{ width: '100%', padding: 13, background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Visit Record'}</button>
        </div>
      )}
      {visits.length === 0 ? <p style={{ color: TEXT_MUTED }}>No visits logged yet.</p> : visits.map(v => {
        const s = statusColors[v.status] || statusColors.completed;
        return (
          <div key={v.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{v.clients?.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 14, color: TEXT }}>{v.visit_type}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : ''}</p>
                {v.po_name && <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>PO: {v.po_name}</p>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: s.bg, color: s.color }}>{s.label}</span>
                <FlagRestrictedButton tableName="po_visits" recordId={v.id} clientId={v.client_id} onFlagged={fetchVisits} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
