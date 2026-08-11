import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const EMPTY_FORM = {
  funder_name: '', grant_name: '', funding_type: '', amount: '',
  start_date: '', end_date: '', required_clients: '', required_outputs: '',
  reporting_frequency: '', next_report_due: '', status: 'active', notes: '',
};

const FUNDING_TYPES = ['State Grant', 'Federal Grant', 'VOCA', 'County Contract', 'Private Foundation', 'Fee for Service', 'Other'];
const REPORTING_FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];

export default function FundingSources() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = width < 640;

  async function fetchItems() {
    const { data } = await supabase.from('funding_sources').select('*').order('next_report_due', { ascending: true, nullsFirst: false });
    if (data) setItems(data);
  }

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(item) {
    setForm({
      funder_name: item.funder_name || '', grant_name: item.grant_name || '', funding_type: item.funding_type || '',
      amount: item.amount ?? '', start_date: item.start_date || '', end_date: item.end_date || '',
      required_clients: item.required_clients ?? '', required_outputs: item.required_outputs || '',
      reporting_frequency: item.reporting_frequency || '', next_report_due: item.next_report_due || '',
      status: item.status || 'active', notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.funder_name.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...form,
      provider_id: user.id,
      amount: form.amount === '' ? null : parseFloat(form.amount),
      required_clients: form.required_clients === '' ? null : parseInt(form.required_clients, 10),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      next_report_due: form.next_report_due || null,
    };
    const { error } = editingId
      ? await supabase.from('funding_sources').update(payload).eq('id', editingId)
      : await supabase.from('funding_sources').insert([payload]);
    if (error) {
      setSaveError('Could not save: ' + error.message);
      setSaving(false);
      return;
    }
    setShowForm(false);
    setSaving(false);
    fetchItems();
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  }

  function reportBadge(item) {
    const days = daysUntil(item.next_report_due);
    if (days === null) return { color: TEXT_MUTED, label: 'No report scheduled' };
    if (days < 0) return { color: RED, label: `Report overdue — ${Math.abs(days)}d` };
    if (days <= 14) return { color: WARNING, label: `Report due in ${days}d` };
    return { color: GREEN, label: `Report due in ${days}d` };
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, width: '100%' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' };

  return (
    <div style={{ padding: isPhone ? 14 : 30, maxWidth: 900, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Funding Sources</h1>
        <button onClick={startAdd} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Funding Source</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Track grants and contracts, their client/output requirements, and upcoming reporting deadlines.</p>

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: TEXT, fontSize: 15, marginTop: 0, marginBottom: 16 }}>{editingId ? 'Edit Funding Source' : 'New Funding Source'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Funder Name *</label>
              <input value={form.funder_name} onChange={e => setForm({ ...form, funder_name: e.target.value })} placeholder="e.g. Florida Dept. of Children & Families" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Grant / Contract Name</label>
              <input value={form.grant_name} onChange={e => setForm({ ...form, grant_name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Funding Type</label>
              <select value={form.funding_type} onChange={e => setForm({ ...form, funding_type: e.target.value })} style={inputStyle}>
                <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select type</option>
                {FUNDING_TYPES.map(t => <option key={t} style={{ background: '#1E2A3A', color: '#fff' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 50000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Required Client Count</label>
              <input type="number" value={form.required_clients} onChange={e => setForm({ ...form, required_clients: e.target.value })} placeholder="e.g. 50" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Reporting Frequency</label>
              <select value={form.reporting_frequency} onChange={e => setForm({ ...form, reporting_frequency: e.target.value })} style={inputStyle}>
                <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select frequency</option>
                {REPORTING_FREQUENCIES.map(f => <option key={f} style={{ background: '#1E2A3A', color: '#fff' }}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Next Report Due</label>
              <input type="date" value={form.next_report_due} onChange={e => setForm({ ...form, next_report_due: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                <option value="active" style={{ background: '#1E2A3A', color: '#fff' }}>Active</option>
                <option value="closed" style={{ background: '#1E2A3A', color: '#fff' }}>Closed</option>
                <option value="pending" style={{ background: '#1E2A3A', color: '#fff' }}>Pending</option>
              </select>
            </div>
          </div>
          <label style={labelStyle}>Required Outputs / Deliverables</label>
          <textarea value={form.required_outputs} onChange={e => setForm({ ...form, required_outputs: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} />

          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.funder_name.trim()} style={{ flex: 1, padding: 12, background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Funding Source'}</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No funding sources tracked yet.</p>
      ) : items.map(item => {
        const r = reportBadge(item);
        return (
          <div key={item.id} onClick={() => startEdit(item)} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderLeft: `4px solid ${r.color}`, borderRadius: 10, padding: 18, marginBottom: 12, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{item.funder_name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{item.grant_name || 'Grant name not set'} {item.amount ? `• $${Number(item.amount).toLocaleString()}` : ''}</p>
                {item.required_clients && <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXT_DIM }}>Requires {item.required_clients} clients served</p>}
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: `${r.color}22`, color: r.color }}>{r.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
