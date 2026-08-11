import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const EMPTY_FORM = {
  requirement_type: '', title: '', issuing_body: '', issue_date: '',
  expiration_date: '', renewal_reminder_days: 90, status: 'current', notes: '',
};

const REQUIREMENT_TYPES = ['State Program Certification', 'Business License', 'Liability Insurance', 'Accreditation', 'Facility Permit', 'Other'];

export default function ComplianceRequirements() {
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
    const { data } = await supabase.from('compliance_requirements').select('*').order('expiration_date', { ascending: true, nullsFirst: false });
    if (data) setItems(data);
  }

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(item) {
    setForm({
      requirement_type: item.requirement_type || '', title: item.title || '', issuing_body: item.issuing_body || '',
      issue_date: item.issue_date || '', expiration_date: item.expiration_date || '',
      renewal_reminder_days: item.renewal_reminder_days ?? 90, status: item.status || 'current', notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...form,
      provider_id: user.id,
      issue_date: form.issue_date || null,
      expiration_date: form.expiration_date || null,
      renewal_reminder_days: form.renewal_reminder_days === '' ? 90 : parseInt(form.renewal_reminder_days, 10),
    };
    const { error } = editingId
      ? await supabase.from('compliance_requirements').update(payload).eq('id', editingId)
      : await supabase.from('compliance_requirements').insert([payload]);
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

  function statusInfo(item) {
    const days = daysUntil(item.expiration_date);
    if (days === null) return { color: TEXT_MUTED, label: 'No expiration set' };
    if (days < 0) return { color: RED, label: 'Expired' };
    if (days <= (item.renewal_reminder_days || 90)) return { color: WARNING, label: `Renew soon — ${days}d left` };
    return { color: GREEN, label: `Current — ${days}d left` };
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, width: '100%' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' };

  return (
    <div style={{ padding: isPhone ? 14 : 30, maxWidth: 900, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Compliance Requirements</h1>
        <button onClick={startAdd} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Requirement</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Track your organization's own licenses, certifications, and accreditations — not client or staff records.</p>

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: TEXT, fontSize: 15, marginTop: 0, marginBottom: 16 }}>{editingId ? 'Edit Requirement' : 'New Requirement'}</h2>
          <label style={labelStyle}>Title *</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. State BIP Program Certification" style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Requirement Type</label>
              <select value={form.requirement_type} onChange={e => setForm({ ...form, requirement_type: e.target.value })} style={inputStyle}>
                <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select type</option>
                {REQUIREMENT_TYPES.map(t => <option key={t} style={{ background: '#1E2A3A', color: '#fff' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Issuing Body</label>
              <input value={form.issuing_body} onChange={e => setForm({ ...form, issuing_body: e.target.value })} placeholder="e.g. Florida DCF" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Issue Date</label>
              <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Expiration Date</label>
              <input type="date" value={form.expiration_date} onChange={e => setForm({ ...form, expiration_date: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Renewal Reminder (days before expiration)</label>
              <input type="number" value={form.renewal_reminder_days} onChange={e => setForm({ ...form, renewal_reminder_days: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                <option value="current" style={{ background: '#1E2A3A', color: '#fff' }}>Current</option>
                <option value="pending_renewal" style={{ background: '#1E2A3A', color: '#fff' }}>Pending Renewal</option>
                <option value="expired" style={{ background: '#1E2A3A', color: '#fff' }}>Expired</option>
              </select>
            </div>
          </div>
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 70 }} />

          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{ flex: 1, padding: 12, background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Requirement'}</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No compliance requirements tracked yet.</p>
      ) : items.map(item => {
        const s = statusInfo(item);
        return (
          <div key={item.id} onClick={() => startEdit(item)} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderLeft: `4px solid ${s.color}`, borderRadius: 10, padding: 18, marginBottom: 12, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{item.title}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{item.requirement_type || 'Type not set'} {item.issuing_body ? `• ${item.issuing_body}` : ''}</p>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: `${s.color}22`, color: s.color }}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
