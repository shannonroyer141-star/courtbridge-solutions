import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function CPSTracking() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
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
    await supabase.from('cps_cases').insert([form]);
    setForm({ client_id: '', case_number: '', agency: 'DCF', case_type: '', case_worker_name: '', case_worker_phone: '', case_worker_email: '', open_date: '', next_hearing_date: '', children_involved: '', reunification_goal: true, safety_plan: false, out_of_home: false, notes: '', status: 'active' });
    setShowForm(false);
    setSaving(false);
    fetchCases();
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('cps_cases').update({ status: newStatus }).eq('id', id);
    fetchCases();
  }

  const statusColors = { active: { bg: '#f8d7da', color: '#721c24', label: '🔴 Active' }, monitoring: { bg: '#fff3cd', color: '#856404', label: '🟡 Monitoring' }, closed: { bg: '#d4edda', color: '#155724', label: '✅ Closed' }, reunified: { bg: '#cce5ff', color: '#004085', label: '💙 Reunified' } };

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>CPS Involvement</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Add CPS Case</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input placeholder="CPS Case Number" value={form.case_number} onChange={e => setForm({...form, case_number: e.target.value})} style={{ flex: 2, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <select value={form.agency} onChange={e => setForm({...form, agency: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <option>DCF</option><option>CPS</option><option>DCFS</option><option>Other</option>
            </select>
          </div>
          <select value={form.case_type} onChange={e => setForm({...form, case_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option value="">Case Type *</option>
            <option>Dependency</option><option>Neglect</option><option>Abuse</option><option>Domestic Violence</option><option>Substance Abuse Related</option><option>Voluntary Services</option><option>Prevention Services</option>
          </select>
          <input placeholder="Children Involved" value={form.children_involved} onChange={e => setForm({...form, children_involved: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input placeholder="Case Worker Name" value={form.case_worker_name} onChange={e => setForm({...form, case_worker_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input placeholder="CW Phone" value={form.case_worker_phone} onChange={e => setForm({...form, case_worker_phone: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input placeholder="CW Email" value={form.case_worker_email} onChange={e => setForm({...form, case_worker_email: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="date" value={form.open_date} onChange={e => setForm({...form, open_date: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            <input type="date" value={form.next_hearing_date} onChange={e => setForm({...form, next_hearing_date: e.target.value})} style={{ flex: 1, padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}><input type="checkbox" checked={form.reunification_goal} onChange={e => setForm({...form, reunification_goal: e.target.checked})} />Reunification Goal</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}><input type="checkbox" checked={form.safety_plan} onChange={e => setForm({...form, safety_plan: e.target.checked})} />Safety Plan</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}><input type="checkbox" checked={form.out_of_home} onChange={e => setForm({...form, out_of_home: e.target.checked})} />Out of Home</label>
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', minHeight: '70px' }} />
          <button onClick={handleSave} disabled={saving || !form.client_id} style={{ width: '100%', padding: '13px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save CPS Case'}</button>
        </div>
      )}
      {cases.length === 0 ? <p style={{ color: '#666' }}>No CPS cases.</p> : cases.map(c => {
        const s = statusColors[c.status] || statusColors.active;
        return (
          <div key={c.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '18px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{c.clients?.name}</p>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#555' }}>{c.agency} — {c.case_type}</p>
                {c.case_worker_name && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>CW: {c.case_worker_name}</p>}
                {c.next_hearing_date && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#E74C3C', fontWeight: 'bold' }}>Next Hearing: {new Date(c.next_hearing_date).toLocaleDateString()}</p>}
              </div>
              <span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: s.bg, color: s.color }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {c.reunification_goal && <span style={{ background: '#cce5ff', color: '#004085', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>Reunification Goal</span>}
              {c.safety_plan && <span style={{ background: '#fff3cd', color: '#856404', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>Safety Plan</span>}
              {c.out_of_home && <span style={{ background: '#f8d7da', color: '#721c24', padding: '3px 10px', borderRadius: '20px', fontSize: '11px' }}>Out of Home</span>}
            </div>
            {(c.status === 'active' || c.status === 'monitoring') && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={() => updateStatus(c.id, 'monitoring')} style={{ padding: '6px 12px', background: 'white', color: '#856404', border: '1px solid #F39C12', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Monitoring</button>
                <button onClick={() => updateStatus(c.id, 'reunified')} style={{ padding: '6px 12px', background: 'white', color: '#004085', border: '1px solid #004085', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Reunified</button>
                <button onClick={() => updateStatus(c.id, 'closed')} style={{ padding: '6px 12px', background: 'white', color: '#155724', border: '1px solid #27AE60', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Close Case</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
