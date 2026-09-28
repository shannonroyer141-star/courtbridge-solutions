import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { missingStaffItems } from '../lib/bipRules';

// Fields follow the DCF BIP Personnel File Review Checklist (BIP Monitoring Review Tools) and
// Florida Rule 65H-2.016(2), (9)(b), 65H-2.018, 65H-2.019, F.A.C.

const EMPTY_FORM = {
  full_name: '', role_title: '', employment_status: 'active', hire_date: '',
  separation_date: '', terminated_for_disqualifying_offense: false, odv_termination_notified_at: '',
  license_type: '', license_number: '', license_expiration: '',
  credential_basis: '', assessor_supervised_experience_years: '',
  dv_training_hours_completed: '', dv_training_completed_at: '',
  facilitator_training_hours: '', supervised_facilitation_hours: '', odv_training_approved_at: '',
  continuing_ed_hours_ytd: '', continuing_ed_year: new Date().getFullYear(),
  good_moral_character_signed_at: '', good_moral_character_expires_at: '', good_moral_character_notarized: false,
  background_check_date: '', employment_history_check_date: '', policy_manual_receipt_date: '',
  address_on_file: false, home_phone_on_file: false, date_of_birth_on_file: false, photo_id_on_file: false,
  resume_or_application_on_file: false, job_description_on_file: false, confidentiality_statement_signed: false,
  notes: '',
};

const NUMBER_FIELDS = ['dv_training_hours_completed', 'continuing_ed_hours_ytd', 'facilitator_training_hours', 'supervised_facilitation_hours', 'assessor_supervised_experience_years'];
const DATE_FIELDS = ['hire_date', 'separation_date', 'license_expiration', 'dv_training_completed_at', 'odv_training_approved_at', 'good_moral_character_signed_at', 'good_moral_character_expires_at', 'background_check_date', 'employment_history_check_date', 'policy_manual_receipt_date'];

// Values allowed by the staff_personnel check constraints.
const ROLE_LABELS = { facilitator: 'BIP Group Facilitator', assessor: 'BIP Assessor', trainer: 'Trainer', admin: 'Administrative', clinical_supervisor: 'Clinical Supervisor', other: 'Other' };
const LICENSE_LABELS = { '490': 'Ch. 490 (Psychologist)', '491': 'Ch. 491 (LCSW / LMHC / LMFT)', '397': 'Ch. 397 (Substance abuse)', exempt_3yr_experience: 'Exempt: 3+ years BIP assessments before the rule', none: 'None' };
const BASIS_LABELS = { degree: "Bachelor's degree", experience: "2 years' DV experience (victims and batterers)", exempt: 'Exempt' };
const opt = { background: '#1E2A3A', color: '#fff' };

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
    const next = {};
    for (const key of Object.keys(EMPTY_FORM)) {
      const v = s[key];
      if (typeof EMPTY_FORM[key] === 'boolean') next[key] = !!v;
      else if (key === 'odv_termination_notified_at') next[key] = v ? v.slice(0, 16) : '';
      else next[key] = v ?? '';
    }
    if (!next.continuing_ed_year) next.continuing_ed_year = new Date().getFullYear();
    setForm(next);
    setEditingId(s.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...form, provider_id: user.id };
    for (const k of NUMBER_FIELDS) payload[k] = form[k] === '' ? null : parseFloat(form[k]);
    for (const k of DATE_FIELDS) payload[k] = form[k] || null;
    payload.continuing_ed_year = form.continuing_ed_year === '' ? null : parseInt(form.continuing_ed_year, 10);
    payload.role_title = form.role_title || null;
    payload.license_type = form.license_type || null;
    payload.credential_basis = form.credential_basis || null;
    payload.odv_termination_notified_at = form.odv_termination_notified_at ? new Date(form.odv_termination_notified_at).toISOString() : null;
    // The DB columns for these three have NOT NULL defaults of 0.
    for (const k of ['facilitator_training_hours', 'supervised_facilitation_hours']) if (payload[k] === null) payload[k] = 0;
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

  function badge(text, color) {
    return <span key={text} style={{ background: `${color}22`, color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{text}</span>;
  }

  function expiryBadge(label, dateStr) {
    if (!dateStr) return null;
    const days = daysUntil(dateStr);
    const color = days < 0 ? RED : days <= 30 ? WARNING : GREEN;
    const text = days < 0 ? `${label} expired` : days <= 30 ? `${label} expires in ${days}d` : `${label} current`;
    return badge(text, color);
  }

  // 65H-2.016(2)(e): ODV must be notified within 24 hours of terminating staff for a disqualifying offense.
  function odvNoticeBadge(s) {
    if (!s.terminated_for_disqualifying_offense) return null;
    if (s.odv_termination_notified_at) return badge('ODV notified of termination', GREEN);
    return badge('Notify ODV within 24 hours of termination', RED);
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, width: '100%' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' };
  const h3 = { fontSize: 13, marginTop: 8, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT_DIM };
  const field = (key, label, type = 'text') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
    </div>
  );
  const select = (key, label, labels, emptyLabel = 'Select') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle}>
        <option value="" style={opt}>{emptyLabel}</option>
        {Object.entries(labels).map(([k, l]) => <option key={k} value={k} style={opt}>{l}</option>)}
      </select>
    </div>
  );
  const check = (key, label) => (
    <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, color: TEXT, marginBottom: 10, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} />
      {label}
    </label>
  );
  const grid = cols => ({ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : `repeat(${cols}, 1fr)`, gap: 12 });
  const isFac = form.role_title === 'facilitator';
  const isAssessor = form.role_title === 'assessor';

  return (
    <div style={{ padding: isPhone ? 14 : 30, maxWidth: 900, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Staff Credentialing</h1>
        <button onClick={startAdd} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Staff Member</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Track staff licensing, training hours, continuing education, and background checks. For BIP facilitators and assessors, each card lists what DCF's Personnel File Review would flag as missing.</p>

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: TEXT, fontSize: 15, marginTop: 0, marginBottom: 16 }}>{editingId ? 'Edit Staff Member' : 'New Staff Member'}</h2>
          <div style={grid(2)}>
            {field('full_name', 'Full Name *')}
            {select('role_title', 'Role', ROLE_LABELS)}
            <div>
              <label style={labelStyle}>Employment Status</label>
              <select value={form.employment_status} onChange={e => setForm({ ...form, employment_status: e.target.value })} style={inputStyle}>
                <option value="active" style={opt}>Active</option>
                <option value="inactive" style={opt}>Inactive</option>
                <option value="terminated" style={opt}>Terminated / Separated</option>
              </select>
            </div>
            {field('hire_date', 'Hire Date', 'date')}
          </div>
          {form.employment_status !== 'active' && <>
            <div style={grid(2)}>
              {field('separation_date', 'Separation Date', 'date')}
              <div />
            </div>
            {check('terminated_for_disqualifying_offense', 'Terminated for a disqualifying offense (65H-2.016(2)(e))')}
            {form.terminated_for_disqualifying_offense && (
              <div style={grid(2)}>
                {field('odv_termination_notified_at', 'ODV Notified (must be within 24 hours)', 'datetime-local')}
              </div>
            )}
          </>}

          <h3 style={h3}>Personnel File (65H-2.016(9)(b))</h3>
          <div style={grid(2)}>
            <div>
              {check('photo_id_on_file', 'Copy of government-issued photo ID')}
              {check('address_on_file', 'Address on file')}
              {check('home_phone_on_file', 'Home phone on file')}
              {check('date_of_birth_on_file', 'Date of birth on file')}
            </div>
            <div>
              {check('resume_or_application_on_file', 'Resume or employment application')}
              {check('job_description_on_file', 'Current job description')}
              {['490', '491'].includes(form.license_type) && check('confidentiality_statement_signed', 'Signed confidentiality statement (Ch. 490/491 licensed)')}
            </div>
          </div>
          <div style={grid(3)}>
            {field('employment_history_check_date', 'Employment History Check', 'date')}
            {field('background_check_date', 'Level 1 Background Check', 'date')}
            {field('policy_manual_receipt_date', 'Policy Manual Receipt Signed', 'date')}
          </div>

          <h3 style={h3}>Licensing and Credentials</h3>
          <div style={grid(3)}>
            {select('license_type', 'License Type', LICENSE_LABELS)}
            {field('license_number', 'License Number')}
            {field('license_expiration', 'License Expiration', 'date')}
          </div>
          <div style={grid(2)}>
            {isFac && select('credential_basis', 'Facilitator Credential (65H-2.018(1)(a))', BASIS_LABELS)}
            {isAssessor && field('assessor_supervised_experience_years', 'Years Supervised Psychosocial Assessment Experience (2 required)', 'number')}
          </div>

          <h3 style={h3}>Training and Continuing Education</h3>
          <div style={grid(2)}>
            {field('dv_training_hours_completed', `DV Training Hours${isFac ? ' (40 required)' : isAssessor ? ' (30 required)' : ''}`, 'number')}
            {field('dv_training_completed_at', 'DV Training Completed On', 'date')}
            {isFac && field('facilitator_training_hours', 'Facilitator Training Hours (21 required)', 'number')}
            {isFac && field('supervised_facilitation_hours', 'Supervised Facilitation Hours (72 required)', 'number')}
            {isFac && field('odv_training_approved_at', 'ODV Approved Training (before facilitating alone)', 'date')}
            {field('continuing_ed_hours_ytd', 'Continuing Ed Hours This Year (12 required)', 'number')}
            {field('continuing_ed_year', 'Continuing Ed Year', 'number')}
          </div>

          <h3 style={h3}>Good Moral Character (Form CF 1649)</h3>
          <div style={grid(3)}>
            {field('good_moral_character_signed_at', 'Most Recent Affidavit Signed', 'date')}
            {field('good_moral_character_expires_at', 'Renewal Due', 'date')}
            <div style={{ paddingTop: 22 }}>{check('good_moral_character_notarized', 'Initial affidavit was notarized')}</div>
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
      ) : staff.map(s => {
        const missing = missingStaffItems(s);
        const isBipRole = s.role_title === 'facilitator' || s.role_title === 'assessor';
        return (
          <div key={s.id} onClick={() => startEdit(s)} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 18, marginBottom: 12, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{s.full_name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{ROLE_LABELS[s.role_title] || s.role_title || 'Role not set'} {s.license_type ? `• ${LICENSE_LABELS[s.license_type] || s.license_type}` : ''}</p>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize', background: s.employment_status === 'active' ? 'rgba(76,175,125,0.15)' : 'rgba(255,255,255,0.08)', color: s.employment_status === 'active' ? GREEN : TEXT_MUTED }}>
                {(s.employment_status || 'active').replace('_', ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {expiryBadge('License', s.license_expiration)}
              {expiryBadge('Good Moral Character', s.good_moral_character_expires_at)}
              {odvNoticeBadge(s)}
              {isBipRole && s.employment_status === 'active' && missing.length === 0 && badge('DCF personnel file complete', GREEN)}
            </div>
            {isBipRole && s.employment_status === 'active' && missing.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: WARNING }}>Missing for DCF: {missing.join(' · ')}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
