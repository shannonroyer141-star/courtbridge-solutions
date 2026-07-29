import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme';

export default function CPSTracking() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({ client_id: '', case_number: '', agency: 'DCF', case_type: '', case_worker_name: '', case_worker_phone: '', case_worker_email: '', open_date: '', next_hearing_date: '', children_involved: '', reunification_goal: true, safety_plan: false, out_of_home: false, notes: '', status: 'active' });

  useEffect(() => { fetchCases(); fetchClients(); }, []);

  async function fetchCases() {
    const { data } = await supabase.from('cps_cases').select('*, clients(name)').order('created_at', { ascending: false });
    if (data) setCases(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.from('cps_cases').insert([form]);
    if (error) {
      setSaveError('Could not save case: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ client_id: '', case_number: '', agency: 'DCF', case_type: '', case_worker_name: '', case_worker_phone: '', case_worker_email: '', open_date: '', next_hearing_date: '', children_involved: '', reunification_goal: true, safety_plan: false, out_of_home: false, notes: '', status: 'active' });
    setShowForm(false);
    setSaving(false);
    fetchCases();
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('cps_cases').update({ status: newStatus }).eq('id', id);
    fetchCases();
  }

  const statusColors = {
    active: { bg: 'rgba(248,113,113,0.15)', color: RED, label: '🔴 Active' },
    monitoring: { bg: 'rgba(61,111,168,0.15)', color: WARNING, label: '🟡 Monitoring' },
    closed: { bg: 'rgba(76,175,125,0.15)', color: GREEN, label: '✅ Closed' },
    reunified: { bg: 'rgba(91,155,240,0.15)', color: ACCENT, label: '💙 Reunified' },
  };

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>CPS Involvement</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add CPS Case</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="CPS Case Number" value={form.case_number} onChange={e => setForm({...form, case_number: e.target.value})} style={{ flex: 2, minWidth: 160, ...inputStyle }} />
            <select value={form.agency} onChange={e => setForm({...form, agency: e.target.value})} style={{ flex: 1, minWidth: 100, ...inputStyle }}>
              <option>DCF</option><option>CPS</option><option>DCFS</option><option>Other</option>
            </select>
          </div>
          <select value={form.case_type} onChange={e => setForm({...form, case_type: e.target.value})} style={{ width: '100%', ...inputStyle }}>
            <option value="">Case Type *</option>
            <option>Dependency</option><option>Neglect</option><option>Abuse</option><option>Domestic Violence</option><option>Substance Abuse Related</option><option>Voluntary Services</option><option>Prevention Services</option>
          </select>
          <input placeholder="Children Involved" value={form.children_involved} onChange={e => setForm({...form, children_involved: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <input placeholder="Case Worker Name" value={form.case_worker_name} onChange={e => setForm({...form, case_worker_name: e.target.value})} style={{ width: '100%', ...inputStyle }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input placeholder="CW Phone" value={form.case_worker_phone} onChange={e => setForm({...form, case_worker_phone: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
            <input placeholder="CW Email" value={form.case_worker_email} onChange={e => setForm({...form, case_worker_email: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="date" value={form.open_date} onChange={e => setForm({...form, open_date: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
            <input type="date" value={form.next_hearing_date} onChange={e => setForm({...form, next_hearing_date: e.target.value})} style={{ flex: 1, minWidth: 140, ...inputStyle }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: TEXT }}><input type="checkbox" checked={form.reunification_goal} onChange={e => setForm({...form, reunification_goal: e.target.checked})} />Reunification Goal</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: TEXT }}><input type="checkbox" checked={form.safety_plan} onChange={e => setForm({...form, safety_plan: e.target.checked})} />Safety Plan</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: TEXT }}><input type="checkbox" checked={form.out_of_home} onChange={e => setForm({...form, out_of_home: e.target.checked})} />Out of Home</label>
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', minHeight: 70, marginBottom: 15, ...inputStyle }} />
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving || !form.client_id} style={{ width: '100%', padding: 13, background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save CPS Case'}</button>
        </div>
      )}
      {cases.length === 0 ? <p style={{ color: TEXT_MUTED }}>No CPS cases.</p> : cases.map(c => {
        const s = statusColors[c.status] || statusColors.active;
        return (
          <div key={c.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 18, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{c.clients?.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{c.agency} — {c.case_type}</p>
                {c.case_worker_name && <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>CW: {c.case_worker_name}</p>}
                {c.next_hearing_date && <p style={{ margin: '3px 0 0', fontSize: 13, color: RED, fontWeight: 'bold' }}>Next Hearing: {new Date(c.next_hearing_date).toLocaleDateString()}</p>}
              </div>
              <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: s.bg, color: s.color }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {c.reunification_goal && <span style={{ background: 'rgba(91,155,240,0.15)', color: ACCENT, padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>Reunification Goal</span>}
              {c.safety_plan && <span style={{ background: 'rgba(61,111,168,0.15)', color: WARNING, padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>Safety Plan</span>}
              {c.out_of_home && <span style={{ background: 'rgba(248,113,113,0.15)', color: RED, padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>Out of Home</span>}
            </div>
            {(c.status === 'active' || c.status === 'monitoring') && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button onClick={() => updateStatus(c.id, 'monitoring')} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', color: WARNING, border: `0.5px solid ${WARNING}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Monitoring</button>
                <button onClick={() => updateStatus(c.id, 'reunified')} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', color: ACCENT, border: `0.5px solid ${ACCENT}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Reunified</button>
                <button onClick={() => updateStatus(c.id, 'closed')} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', color: GREEN, border: `0.5px solid ${GREEN}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Close Case</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
