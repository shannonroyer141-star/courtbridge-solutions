import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme';
import { NotesWarning, FlagRestrictedButton } from '../components/VictimInfoWarning';

export default function MeetingLog() {
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
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
    setSaveError(null);
    const { error } = await supabase.from('meeting_log').insert([form]);
    if (error) {
      setSaveError('Could not save meeting: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ client_id: '', meeting_type: 'AA', meeting_date: '', meeting_time: '', location_name: '', verification_method: 'gps', secretary_name: '', notes: '', verified: false });
    setShowForm(false);
    setSaving(false);
    fetchMeetings();
  }

  async function toggleVerified(m) {
    await supabase.from('meeting_log').update({ verified: !m.verified }).eq('id', m.id);
    fetchMeetings();
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Meeting Log</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Log Meeting</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.meeting_type} onChange={e => setForm({...form, meeting_type: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="AA">AA (Alcoholics Anonymous)</option>
            <option value="NA">NA (Narcotics Anonymous)</option>
            <option value="CA">CA (Cocaine Anonymous)</option>
            <option value="Smart Recovery">SMART Recovery</option>
            <option value="Other">Other Support Group</option>
          </select>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="date" value={form.meeting_date} onChange={e => setForm({...form, meeting_date: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
            <input type="time" value={form.meeting_time} onChange={e => setForm({...form, meeting_time: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
          </div>
          <input placeholder="Location Name" value={form.location_name} onChange={e => setForm({...form, location_name: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <input placeholder="Secretary Name (optional)" value={form.secretary_name} onChange={e => setForm({...form, secretary_name: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <NotesWarning />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', minHeight: 60, marginBottom: 15, ...inputStyle }} />
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.meeting_date} style={{ width: '100%', padding: 13, background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Meeting Record'}</button>
        </div>
      )}
      {meetings.length === 0 ? <p style={{ color: TEXT_MUTED }}>No meetings logged yet.</p> : meetings.map(m => (
        <div key={m.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{m.clients?.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 14, color: TEXT }}>{m.meeting_type} — {m.location_name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{m.meeting_date ? new Date(m.meeting_date).toLocaleDateString() : ''}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: m.verified ? 'rgba(76,175,125,0.15)' : 'rgba(61,111,168,0.15)', color: m.verified ? GREEN : WARNING }}>{m.verified ? '✅ Verified' : '⏳ Pending'}</span>
              {!m.verified && <button onClick={() => toggleVerified(m)} style={{ padding: '5px 12px', background: ACCENT, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Mark Verified</button>}
              <FlagRestrictedButton tableName="meeting_log" recordId={m.id} clientId={m.client_id} onFlagged={fetchMeetings} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
