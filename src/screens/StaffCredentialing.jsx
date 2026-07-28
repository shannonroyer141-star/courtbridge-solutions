import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const EMPTY_FORM = {
  full_name: '', role_title: '', employment_status: 'active', hire_date: '',
  license_type: '', license_number: '', license_expiration: '',
  dv_training_hours_completed: '', dv_training_completed_at: '',
  continuing_ed_hours_ytd: '', continuing_ed_year: new Date().getFullYear(),
  good_moral_character_signed_at: '', good_moral_character_expires_at: '',
  background_check_date: '', notes: '',
};

export default function StaffCredentialing() {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => { fetchStaff(); }, []);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = width < 640;

  async function fetchStaff() {
    const { data } = await supabase.from('staff_personnel').select('*').order('full_name');
    if (data) setStaff(data);
  }

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(s) {
    setForm({
      full_name: s.full_name || '', role_title: s.role_title || '', employment_status: s.employment_status || 'active',
      hire_date: s.hire_date || '', license_type: s.license_type || '', license_number: s.license_number || '',
      license_expiration: s.license_expiration || '', dv_training_hours_completed: s.dv_training_hours_completed ?? '',
      dv_training_completed_at: s.dv_training_completed_at || '', continuing_ed_hours_ytd: s.continuing_ed_hours_ytd ?? '',
      continuing_ed_year: s.continuing_ed_year || new Date().getFullYear(),
      good_moral_character_signed_at: s.good_moral_character_signed_at || '', good_moral_character_expires_at: s.good_moral_character_expires_at || '',
      background_check_date: s.background_check_date || '', notes: s.notes || '',
    });
    setEditingId(s.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...form,
      provider_id: user.id,
      dv_training_hours_completed: form.dv_training_hours_completed === '' ? null : parseFloat(form.dv_training_hours_completed),
      continuing_ed_hours_ytd: form.continuing_ed_hours_ytd === '' ? null : parseFloat(form.continuing_ed_hours_ytd),
      continuing_ed_year: form.continuing_ed_year === '' ? null : parseInt(form.continuing_ed_year, 10),
      hire_date: form.hire_date || null,
      license_expiration: form.license_expiration || null,
      dv_training_completed_at: form.dv_training_completed_at || null,
      good_moral_character_signed_at: form.good_moral_character_signed_at || null,
      good_moral_character_expires_at: form.good_moral_character_expires_at || null,
      background_check_date: form.background_check_date || null,
    };
    const { error } = editingId
      ? await supabase.from('staff_personnel').update(payload).eq('id', editingId)
      : await supabase.from('staff_personnel').insert([payload]);
    if (error) {
      setSaveError('Could not save: ' + error.message);
      setSaving(false);
      return;
    }
    setShowForm(false);
    setSaving(false);
    fetchStaff();
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  }

  function expiryBadge(label, dateStr) {
    if (!dateStr) return null;
    const days = daysUntil(dateStr);
    const color = days < 0 ? RED : days <= 30 ? WARNING : GREEN;
    const text = days < 0 ? `${label} expired` : days <= 30 ? `${label} expires in ${days}d` : `${label} current`;
    return (
      <span style={{ background: `${color}22`, color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{text}</span>
    );
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, width: '100%' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' };
  const field = (key, label, type = 'text') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
    </div>
  );

  return (
    <div style={{ padding: isPhone ? 14 : 30, maxWidth: 900, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Staff Credentialing</h1>
        <button onClick={startAdd} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Staff Member</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Track staff licensing, DV training hours, continuing education, and background checks for audit readiness.</p>

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: TEXT, fontSize: 15, marginTop: 0, marginBottom: 16 }}>{editingId ? 'Edit Staff Member' : 'New Staff Member'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 12 }}>
            {field('full_name', 'Full Name *')}
            {field('role_title', 'Role / Title')}
            <div>
              <label style={labelStyle}>Employment Status</label>
              <select value={form.employment_status} onChange={e => setForm({ ...form, employment_status: e.target.value })} style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            {field('hire_date', 'Hire Date', 'date')}
          </div>

          <h3 style={{ color: TEXT, fontSize: 13, marginTop: 8, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT_DIM }}>Licensing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
            {field('license_type', 'License Type')}
            {field('license_number', 'License Number')}
            {field('license_expiration', 'License Expiration', 'date')}
          </div>

          <h3 style={{ color: TEXT, fontSize: 13, marginTop: 8, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT_DIM }}>DV Training &amp; Continuing Education</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 12 }}>
            {field('dv_training_hours_completed', 'DV Training Hours Completed', 'number')}
            {field('dv_training_completed_at', 'DV Training Completed On', 'date')}
            {field('continuing_ed_hours_ytd', 'Continuing Ed Hours (YTD)', 'number')}
            {field('continuing_ed_year', 'Continuing Ed Year', 'number')}
          </div>

          <h3 style={{ color: TEXT, fontSize: 13, marginTop: 8, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT_DIM }}>Background &amp; Character</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
            {field('good_moral_character_signed_at', 'Good Moral Character Signed', 'date')}
            {field('good_moral_character_expires_at', 'Good Moral Character Expires', 'date')}
            {field('background_check_date', 'Background Check Date', 'date')}
          </div>

          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 70 }} />

          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.full_name.trim()} style={{ flex: 1, padding: 12, background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Staff Member'}</button>
          </div>
        </div>
      )}

      {staff.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No staff records yet.</p>
      ) : staff.map(s => (
        <div key={s.id} onClick={() => startEdit(s)} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 18, marginBottom: 12, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{s.full_name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{s.role_title || 'Role not set'} {s.license_type ? `• ${s.license_type}` : ''}</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize', background: s.employment_status === 'active' ? 'rgba(76,175,125,0.15)' : 'rgba(255,255,255,0.08)', color: s.employment_status === 'active' ? GREEN : TEXT_MUTED }}>
              {(s.employment_status || 'active').replace('_', ' ')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {expiryBadge('License', s.license_expiration)}
            {expiryBadge('Good Moral Character', s.good_moral_character_expires_at)}
          </div>
        </div>
      ))}
    </div>
  );
}
