import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

// Victim Notifications -- the ONE place victim information is allowed (Policies section 5).
// Florida Rule 65H-2.016(8), F.A.C.: BIPs must notify (or attempt to notify) the victim within
// 3 business days of enrollment and within 24 hours of discharge, and keep a dated record.
// Victim names/contact info come only through the get_victim_contacts / save_victim_contact
// database functions, which check permission and log every view. Notice records hold no
// victim-identifying data.

const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14, width: '100%' };
const labelStyle = { fontSize: 12, color: TEXT_MUTED, marginBottom: 4, display: 'block' };
const sectionCard = { background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 20 };
const optStyle = { background: '#1E2A3A', color: '#fff' };
const btn = (bg = ACCENT) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: NAV_FONT });
const ghostBtn = { background: 'none', border: `0.5px solid ${BORDER}`, color: TEXT, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: NAV_FONT };

const SOURCE_LABELS = { referral_source: 'Referral source', court_documents: 'Court documents', police_report: 'Police report' };
const METHOD_LABELS = { mail: 'Mail', email: 'Email', phone: 'Phone' };
const NOTICE_METHOD_LABELS = { letter: 'Letter', email: 'Email', phone: 'Phone' };
const WANTS_LABELS = { yes: 'Yes', no: 'No', not_yet_asked: 'Not yet asked' };
const REASON_LABELS = { completion: 'Completion', termination: 'Termination', transfer: 'Transfer' };

function Field({ label, children }) {
  return <div style={{ marginBottom: 4 }}><span style={labelStyle}>{label}</span>{children}</div>;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Mirrors victim_notice_due_at() in the database: 3 business days after the enrollment date
// (weekends skipped, holidays not -- the rule doesn't list them), end of day.
function enrollmentDueDate(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  let added = 0;
  while (added < 3) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  d.setHours(23, 59, 59, 0);
  return d;
}

function noticeStatus(n) {
  const due = new Date(n.due_at);
  if (n.completed_at) {
    return new Date(n.completed_at) <= due
      ? { label: 'Done on time', color: GREEN }
      : { label: 'Done late', color: RED };
  }
  const hoursLeft = (due - Date.now()) / 3600000;
  if (hoursLeft < 0) return { label: 'Overdue', color: RED };
  if (hoursLeft < 24) return { label: 'Due within 24 hours', color: WARNING };
  return { label: 'Pending', color: TEXT_MUTED };
}

function fmt(iso) {
  return iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function blankContact() {
  return { id: null, victim_name: '', contact_method: 'mail', contact_value: '', info_source: '', wants_updates: 'not_yet_asked' };
}

function blankNotice(type, client) {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: null, notice_type: type, victim_contact_id: '',
    event_date: type === 'enrollment' ? (client?.enrollment_date || today) : '',
    event_datetime: type === 'discharge' ? toLocalInput(new Date().toISOString()) : '',
    discharge_reason: '', done: false, method: type === 'discharge' ? 'phone' : 'letter', outcome: 'sent', completed_at: toLocalInput(new Date().toISOString()),
    included_dv_center: false, included_law_enforcement: false, included_probation: 'no', included_state_attorney: false,
    included_program_goals: false, included_not_privileged: false, asked_update_preference: false,
  };
}

export default function VictimNotifications({ session }) {
  const [access, setAccess] = useState(null); // null = checking
  const [isAdmin, setIsAdmin] = useState(false);
  const [clients, setClients] = useState([]);
  const [openNotices, setOpenNotices] = useState([]);
  const [allNoticeClientIds, setAllNoticeClientIds] = useState(new Set());
  const [clientId, setClientId] = useState('');
  const [notices, setNotices] = useState([]);
  const [contacts, setContacts] = useState(null); // null = not opened (opening is logged)
  const [contactForm, setContactForm] = useState(null);
  const [noticeForm, setNoticeForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [staff, setStaff] = useState([]);

  const client = clients.find(c => c.id === clientId) || null;

  useEffect(() => { init(); }, []);
  useEffect(() => {
    setContacts(null); setContactForm(null); setNoticeForm(null); setError(null);
    if (clientId) fetchNotices(clientId); else setNotices([]);
  }, [clientId]);

  async function init() {
    const [{ data: ok }, { data: me }] = await Promise.all([
      supabase.rpc('has_victim_notification_access'),
      supabase.from('profiles').select('is_org_admin, is_founder, organization_id').eq('id', session.user.id).single(),
    ]);
    setAccess(!!ok);
    const admin = !!(me?.is_org_admin || me?.is_founder);
    setIsAdmin(admin);
    if (!ok) return;
    fetchOverview();
    if (admin && me?.organization_id) fetchStaff(me.organization_id);
  }

  async function fetchOverview() {
    const [{ data: cs }, { data: open }, { data: enrollNotices }] = await Promise.all([
      supabase.from('clients').select('id, name, enrollment_date').eq('population_type', 'bip').order('name'),
      supabase.from('victim_notifications').select('*, clients(name)').is('completed_at', null).order('due_at'),
      supabase.from('victim_notifications').select('client_id').eq('notice_type', 'enrollment'),
    ]);
    setClients(cs || []);
    setOpenNotices(open || []);
    setAllNoticeClientIds(new Set((enrollNotices || []).map(n => n.client_id)));
  }

  async function fetchStaff(orgId) {
    const { data } = await supabase.from('profiles').select('id, full_name, email, is_org_admin, is_founder, role, can_manage_victim_notifications')
      .eq('organization_id', orgId).neq('role', 'client').order('full_name');
    setStaff(data || []);
  }

  async function fetchNotices(id) {
    const { data } = await supabase.from('victim_notifications').select('*').eq('client_id', id).order('event_at', { ascending: false });
    setNotices(data || []);
  }

  async function openContacts() {
    setError(null);
    const { data, error: err } = await supabase.rpc('get_victim_contacts', { p_client_id: clientId });
    if (err) { setError(err.message); return; }
    setContacts(data || []);
  }

  async function saveContact() {
    const f = contactForm;
    if (!f.victim_name.trim() || !f.contact_value.trim() || !f.info_source) { setError('Name, contact, and where the information came from are all required.'); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.rpc('save_victim_contact', {
      p_id: f.id, p_client_id: clientId, p_victim_name: f.victim_name, p_contact_method: f.contact_method,
      p_contact_value: f.contact_value, p_info_source: f.info_source, p_wants_updates: f.wants_updates,
    });
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setContactForm(null);
    openContacts();
  }

  function editNotice(n) {
    setNoticeForm({
      id: n.id, notice_type: n.notice_type, victim_contact_id: n.victim_contact_id || '',
      event_date: n.notice_type === 'enrollment' ? toLocalInput(n.event_at).split('T')[0] : '',
      event_datetime: n.notice_type === 'discharge' ? toLocalInput(n.event_at) : '',
      discharge_reason: n.discharge_reason || '', done: !!n.completed_at,
      method: n.method || (n.notice_type === 'discharge' ? 'phone' : 'letter'), outcome: n.outcome || 'sent',
      completed_at: toLocalInput(n.completed_at || new Date().toISOString()),
      included_dv_center: n.included_dv_center, included_law_enforcement: n.included_law_enforcement,
      included_probation: n.included_probation, included_state_attorney: n.included_state_attorney,
      included_program_goals: n.included_program_goals, included_not_privileged: n.included_not_privileged,
      asked_update_preference: n.asked_update_preference,
    });
  }

  async function saveNotice() {
    const f = noticeForm;
    const isEnroll = f.notice_type === 'enrollment';
    if (isEnroll ? !f.event_date : !f.event_datetime) { setError(isEnroll ? 'Enter the enrollment date.' : 'Enter the discharge date and time.'); return; }
    if (!isEnroll && !f.discharge_reason) { setError('Choose the discharge reason.'); return; }
    setSaving(true); setError(null);
    const payload = {
      client_id: clientId,
      victim_contact_id: f.victim_contact_id || null,
      notice_type: f.notice_type,
      event_at: isEnroll ? new Date(`${f.event_date}T12:00:00`).toISOString() : new Date(f.event_datetime).toISOString(),
      discharge_reason: isEnroll ? null : f.discharge_reason,
      method: f.done ? f.method : null,
      outcome: f.done ? f.outcome : null,
      completed_at: f.done ? new Date(f.completed_at).toISOString() : null,
      included_dv_center: f.included_dv_center, included_law_enforcement: f.included_law_enforcement,
      included_probation: f.included_probation, included_state_attorney: f.included_state_attorney,
      included_program_goals: isEnroll && f.included_program_goals, included_not_privileged: isEnroll && f.included_not_privileged,
      asked_update_preference: isEnroll && f.asked_update_preference,
      // due_at is recalculated by the database trigger; this value only satisfies NOT NULL.
      due_at: new Date().toISOString(),
    };
    let err;
    if (f.id) {
      ({ error: err } = await supabase.from('victim_notifications').update(payload).eq('id', f.id));
    } else {
      ({ error: err } = await supabase.from('victim_notifications').insert([{ ...payload, created_by: session.user.id }]));
    }
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setNoticeForm(null);
    fetchNotices(clientId);
    fetchOverview();
  }

  async function toggleStaffAccess(p) {
    setError(null);
    const { error: err } = await supabase.from('profiles').update({ can_manage_victim_notifications: !p.can_manage_victim_notifications }).eq('id', p.id);
    if (err) { setError('Could not change access: ' + err.message); return; }
    setStaff(staff.map(s => s.id === p.id ? { ...s, can_manage_victim_notifications: !s.can_manage_victim_notifications } : s));
  }

  // The file copy leaves out victim contact info, as 65H-2.016(8)(d) requires.
  function printFileCopy(n) {
    const isEnroll = n.notice_type === 'enrollment';
    const yn = v => (v === true || v === 'yes') ? 'Yes' : v === 'not_applicable' ? 'Not applicable' : 'No';
    const rows = [
      ['Local certified domestic violence center contact info', yn(n.included_dv_center)],
      ['Law enforcement contact info', yn(n.included_law_enforcement)],
      ['Probation or parole contact info', yn(n.included_probation)],
      ["State attorney's office contact info", yn(n.included_state_attorney)],
      ...(isEnroll ? [
        ['Goals and objectives of the program', yn(n.included_program_goals)],
        ['Victim advised disclosures are not privileged (s. 90.5036, F.S.)', yn(n.included_not_privileged)],
        ['Asked whether and how the victim wants updates', yn(n.asked_update_preference)],
      ] : []),
    ];
    const status = noticeStatus(n);
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Victim Notification Record</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:720px;margin:0 auto;}h1{color:#1B3A6B;border-bottom:3px solid #1B3A6B;padding-bottom:12px;font-size:20px;}.field{margin-bottom:8px;font-size:14px;}.label{font-weight:bold;color:#555;}table{width:100%;border-collapse:collapse;margin-top:14px;}th,td{border:1px solid #ddd;padding:7px 9px;font-size:13px;text-align:left;}th{background:#f2f2f2;}.note{background:#eef4fb;border-left:4px solid #1B3A6B;padding:10px 14px;font-size:12px;margin:18px 0;}</style>
      </head><body>
      <h1>Victim Notification Record: ${isEnroll ? 'Enrollment' : 'Discharge'}</h1>
      <div class="field"><span class="label">Participant: </span>${escapeHtml(client?.name)}</div>
      <div class="field"><span class="label">${isEnroll ? 'Enrollment date' : 'Discharge date/time'}: </span>${escapeHtml(isEnroll ? new Date(n.event_at).toLocaleDateString() : fmt(n.event_at))}</div>
      ${isEnroll ? '' : `<div class="field"><span class="label">Reason for discharge: </span>${escapeHtml(REASON_LABELS[n.discharge_reason])}</div>`}
      <div class="field"><span class="label">Deadline: </span>${escapeHtml(fmt(n.due_at))} (${isEnroll ? '3 business days after enrollment' : '24 hours after discharge'})</div>
      <div class="field"><span class="label">Notice ${n.outcome === 'attempted' ? 'attempted' : 'sent'}: </span>${escapeHtml(n.completed_at ? fmt(n.completed_at) : 'Not yet')}</div>
      <div class="field"><span class="label">Method: </span>${escapeHtml(NOTICE_METHOD_LABELS[n.method] || '')}</div>
      <div class="field"><span class="label">Status: </span>${escapeHtml(status.label)}</div>
      <table><tr><th>Required content (Rule 65H-2.016(8))</th><th>Included</th></tr>
      ${rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`).join('')}
      </table>
      <div class="note">Victim name and contact information are withheld from this file copy as required by Rule 65H-2.016(8)(d), F.A.C.</div>
      <div style="font-size:11px;color:#888;margin-top:30px;">Generated ${escapeHtml(new Date().toLocaleString())} from CourtBridge Solutions.</div>
      </body></html>`);
    win.document.close();
    win.print();
  }

  if (access === null) return <div style={{ padding: 32, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading...</div>;

  if (!access) {
    return (
      <div style={{ padding: 32, fontFamily: NAV_FONT, color: TEXT, maxWidth: 720 }}>
        <h2 style={{ marginTop: 0 }}>Victim Notifications</h2>
        <div style={sectionCard}>
          You don't have access to victim notification records. An org admin can turn this on for you on this screen. It is only for staff who send victim notices for Batterers' Intervention Program participants.
        </div>
      </div>
    );
  }

  const missingEnrollment = clients.filter(c => c.enrollment_date && !allNoticeClientIds.has(c.id));
  const nf = noticeForm;
  const check = (key, label) => (
    <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13.5, marginBottom: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!nf[key]} onChange={e => setNoticeForm({ ...nf, [key]: e.target.checked })} style={{ marginTop: 3 }} />
      <span>{label}</span>
    </label>
  );

  return (
    <div style={{ padding: 32, fontFamily: NAV_FONT, color: TEXT, maxWidth: 980 }}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>Victim Notifications</h2>
      <div style={{ color: TEXT_MUTED, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
        For Batterers' Intervention Program participants only. Florida Rule 65H-2.016(8) requires notifying the victim within <strong>3 business days of enrollment</strong> and within <strong>24 hours of discharge</strong>. Participants can never see this screen, and every time victim contact details are opened it is recorded in the audit log.
      </div>

      {error && <div style={{ ...sectionCard, borderColor: RED, color: RED, padding: 14 }}>{error}</div>}

      {/* DEADLINES OVERVIEW */}
      <div style={sectionCard}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Deadlines</div>
        {openNotices.length === 0 && missingEnrollment.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: 13.5 }}>Nothing due. All recorded notices are complete.</div>}
        {missingEnrollment.map(c => {
          const due = enrollmentDueDate(c.enrollment_date);
          const overdue = due < new Date();
          return (
            <div key={`m-${c.id}`} onClick={() => setClientId(c.id)} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, cursor: 'pointer', fontSize: 13.5 }}>
              <span><strong>{c.name}</strong> · enrollment notice not recorded yet</span>
              <span style={{ color: overdue ? RED : WARNING, whiteSpace: 'nowrap' }}>{overdue ? 'Overdue' : 'Due'} {due.toLocaleDateString()}</span>
            </div>
          );
        })}
        {openNotices.map(n => {
          const s = noticeStatus(n);
          return (
            <div key={n.id} onClick={() => setClientId(n.client_id)} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, cursor: 'pointer', fontSize: 13.5 }}>
              <span><strong>{n.clients?.name}</strong> · {n.notice_type === 'enrollment' ? 'Enrollment' : 'Discharge'} notice</span>
              <span style={{ color: s.color, whiteSpace: 'nowrap' }}>{s.label} · due {fmt(n.due_at)}</span>
            </div>
          );
        })}
      </div>

      {/* PARTICIPANT PICKER */}
      <div style={sectionCard}>
        <Field label="BIP participant">
          <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
            <option value="" style={optStyle}>Select a participant</option>
            {clients.map(c => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
          </select>
        </Field>
        {clients.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No BIP participants found. A participant appears here when their program type is set to BIP.</div>}
        {client && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>Enrollment date: {client.enrollment_date ? new Date(`${client.enrollment_date}T12:00:00`).toLocaleDateString() : 'not set on the client record'}</div>}
      </div>

      {client && <>
        {/* VICTIM CONTACTS */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700 }}>Victim contact</div>
            {contacts === null
              ? <button style={ghostBtn} onClick={openContacts}>Open contact details (logged)</button>
              : <button style={ghostBtn} onClick={() => { setContactForm(blankContact()); setError(null); }}>Add victim contact</button>}
          </div>
          {contacts === null && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>Contact details stay hidden until you open them. Opening them is recorded in the audit log.</div>}
          {contacts && contacts.length === 0 && !contactForm && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No victim contact recorded yet.</div>}
          {contacts && contacts.map(v => (
            <div key={v.id} style={{ padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, fontSize: 13.5, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div><strong>{v.victim_name}</strong> · {METHOD_LABELS[v.contact_method]}: {v.contact_value}</div>
                <div style={{ color: TEXT_DIM, fontSize: 12.5 }}>Source: {SOURCE_LABELS[v.info_source]} · Wants updates: {WANTS_LABELS[v.wants_updates]}</div>
              </div>
              <button style={ghostBtn} onClick={() => setContactForm({ ...v })}>Edit</button>
            </div>
          ))}
          {contactForm && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12.5, color: WARNING, marginBottom: 12, lineHeight: 1.5 }}>
                Record only the victim's name and one way to reach them. Contact information must come from the referral source, court documents, or the police report, never from the participant (Rule 65H-2.016(8)(a)). No safety plans, locations, or information about children.
              </div>
              <Field label="Victim name *"><input style={inputStyle} value={contactForm.victim_name} onChange={e => setContactForm({ ...contactForm, victim_name: e.target.value })} /></Field>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 160px' }}><Field label="Contact method *">
                  <select style={inputStyle} value={contactForm.contact_method} onChange={e => setContactForm({ ...contactForm, contact_method: e.target.value })}>
                    {Object.entries(METHOD_LABELS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}
                  </select></Field></div>
                <div style={{ flex: '3 1 300px' }}><Field label={contactForm.contact_method === 'mail' ? 'Mailing address *' : contactForm.contact_method === 'email' ? 'Email *' : 'Phone *'}>
                  <input style={inputStyle} value={contactForm.contact_value} onChange={e => setContactForm({ ...contactForm, contact_value: e.target.value })} /></Field></div>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 240px' }}><Field label="Where this information came from *">
                  <select style={inputStyle} value={contactForm.info_source} onChange={e => setContactForm({ ...contactForm, info_source: e.target.value })}>
                    <option value="" style={optStyle}>Select</option>
                    {Object.entries(SOURCE_LABELS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}
                  </select></Field></div>
                <div style={{ flex: '1 1 240px' }}><Field label="Victim wants updates on progress, non-compliance, discharge">
                  <select style={inputStyle} value={contactForm.wants_updates} onChange={e => setContactForm({ ...contactForm, wants_updates: e.target.value })}>
                    {Object.entries(WANTS_LABELS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}
                  </select></Field></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn()} disabled={saving} onClick={saveContact}>{saving ? 'Saving...' : 'Save contact'}</button>
                <button style={ghostBtn} onClick={() => setContactForm(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* NOTICES */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700 }}>Notices</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={ghostBtn} onClick={() => { setNoticeForm(blankNotice('enrollment', client)); setError(null); }}>+ Enrollment notice</button>
              <button style={ghostBtn} onClick={() => { setNoticeForm(blankNotice('discharge', client)); setError(null); }}>+ Discharge notice</button>
            </div>
          </div>
          {notices.length === 0 && !noticeForm && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No notices recorded for this participant.</div>}
          {notices.map(n => {
            const s = noticeStatus(n);
            return (
              <div key={n.id} style={{ padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, fontSize: 13.5, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div><strong>{n.notice_type === 'enrollment' ? 'Enrollment' : `Discharge (${REASON_LABELS[n.discharge_reason]})`}</strong> · <span style={{ color: s.color }}>{s.label}</span></div>
                  <div style={{ color: TEXT_DIM, fontSize: 12.5 }}>
                    Due {fmt(n.due_at)}{n.completed_at && ` · ${n.outcome === 'attempted' ? 'Attempted' : 'Sent'} ${fmt(n.completed_at)} by ${NOTICE_METHOD_LABELS[n.method]}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={ghostBtn} onClick={() => printFileCopy(n)}>Print file copy</button>
                  <button style={ghostBtn} onClick={() => editNotice(n)}>{n.completed_at ? 'Edit' : 'Record as sent'}</button>
                </div>
              </div>
            );
          })}

          {nf && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>{nf.notice_type === 'enrollment' ? 'Enrollment notice' : 'Discharge notice'}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {nf.notice_type === 'enrollment' ? (
                  <div style={{ flex: '1 1 200px' }}><Field label="Enrollment date *"><input type="date" style={inputStyle} value={nf.event_date} onChange={e => setNoticeForm({ ...nf, event_date: e.target.value })} /></Field></div>
                ) : <>
                  <div style={{ flex: '1 1 220px' }}><Field label="Discharge date and time *"><input type="datetime-local" style={inputStyle} value={nf.event_datetime} onChange={e => setNoticeForm({ ...nf, event_datetime: e.target.value })} /></Field></div>
                  <div style={{ flex: '1 1 200px' }}><Field label="Reason for discharge *">
                    <select style={inputStyle} value={nf.discharge_reason} onChange={e => setNoticeForm({ ...nf, discharge_reason: e.target.value })}>
                      <option value="" style={optStyle}>Select</option>
                      {Object.entries(REASON_LABELS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}
                    </select></Field></div>
                </>}
                {contacts && contacts.length > 0 && (
                  <div style={{ flex: '1 1 200px' }}><Field label="Victim">
                    <select style={inputStyle} value={nf.victim_contact_id} onChange={e => setNoticeForm({ ...nf, victim_contact_id: e.target.value })}>
                      <option value="" style={optStyle}>Select</option>
                      {contacts.map(v => <option key={v.id} value={v.id} style={optStyle}>{v.victim_name}</option>)}
                    </select></Field></div>
                )}
              </div>
              <div style={{ color: TEXT_MUTED, fontSize: 12.5, marginBottom: 14 }}>
                Deadline: {nf.notice_type === 'enrollment'
                  ? (nf.event_date ? enrollmentDueDate(nf.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + ' (3 business days; weekends skipped, holidays are not)' : 'enter the enrollment date')
                  : (nf.event_datetime ? fmt(new Date(new Date(nf.event_datetime).getTime() + 86400000).toISOString()) + ' (24 hours after discharge)' : 'enter the discharge time')}
              </div>

              <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Required content</div>
              {check('included_dv_center', 'Contact info for the local certified domestic violence center')}
              {check('included_law_enforcement', 'Contact info for law enforcement')}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, marginBottom: 8 }}>
                <span>Probation or parole contact info:</span>
                <select style={{ ...inputStyle, width: 'auto', marginBottom: 0, padding: '6px 10px' }} value={nf.included_probation} onChange={e => setNoticeForm({ ...nf, included_probation: e.target.value })}>
                  <option value="yes" style={optStyle}>Included</option>
                  <option value="no" style={optStyle}>Not included</option>
                  <option value="not_applicable" style={optStyle}>Not applicable</option>
                </select>
              </div>
              {check('included_state_attorney', "Contact info for the state attorney's office")}
              {nf.notice_type === 'enrollment' && <>
                {check('included_program_goals', 'Goals and objectives of the program')}
                {check('included_not_privileged', 'Told the victim that what they tell program staff is not privileged (s. 90.5036, F.S.)')}
                {check('asked_update_preference', 'Asked whether and how the victim wants updates on progress, non-compliance, and discharge')}
              </>}

              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, margin: '14px 0', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={nf.done} onChange={e => setNoticeForm({ ...nf, done: e.target.checked })} />
                The notice has been sent or attempted
              </label>
              {nf.done && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}><Field label="Method">
                    <select style={inputStyle} value={nf.method} onChange={e => setNoticeForm({ ...nf, method: e.target.value })}>
                      {nf.notice_type === 'enrollment' && <option value="letter" style={optStyle}>Letter</option>}
                      <option value="email" style={optStyle}>Email</option>
                      <option value="phone" style={optStyle}>Phone</option>
                    </select></Field></div>
                  <div style={{ flex: '1 1 160px' }}><Field label="Outcome">
                    <select style={inputStyle} value={nf.outcome} onChange={e => setNoticeForm({ ...nf, outcome: e.target.value })}>
                      <option value="sent" style={optStyle}>Sent / reached</option>
                      <option value="attempted" style={optStyle}>Attempted</option>
                    </select></Field></div>
                  <div style={{ flex: '1 1 220px' }}><Field label="Date and time">
                    <input type="datetime-local" style={inputStyle} value={nf.completed_at} onChange={e => setNoticeForm({ ...nf, completed_at: e.target.value })} /></Field></div>
                </div>
              )}
              {nf.notice_type === 'discharge' && <div style={{ color: TEXT_DIM, fontSize: 12, marginBottom: 12 }}>Discharge notices must go by email or phone (Rule 65H-2.016(8)(c)).</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn()} disabled={saving} onClick={saveNotice}>{saving ? 'Saving...' : 'Save notice'}</button>
                <button style={ghostBtn} onClick={() => setNoticeForm(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </>}

      {/* STAFF ACCESS (org admins) */}
      {isAdmin && (
        <div style={sectionCard}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Staff access</div>
          <div style={{ color: TEXT_MUTED, fontSize: 13, marginBottom: 12 }}>Only turn this on for staff who send victim notices. Org admins always have access. Staff can't turn this on for themselves.</div>
          {staff.map(p => {
            const admin = p.is_org_admin || p.is_founder;
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `0.5px solid ${BORDER}`, fontSize: 13.5, gap: 12 }}>
                <span>{p.full_name || p.email}{admin && <span style={{ color: TEXT_DIM }}> · admin</span>}</span>
                {admin
                  ? <span style={{ color: TEXT_DIM, fontSize: 12.5 }}>Always has access</span>
                  : <button style={{ ...ghostBtn, color: p.can_manage_victim_notifications ? GREEN : TEXT }} onClick={() => toggleStaffAccess(p)}>
                      {p.can_manage_victim_notifications ? 'Has access (turn off)' : 'Give access'}
                    </button>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
