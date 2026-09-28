import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TEXT_MUTED, TEXT_DIM, WARNING } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';
import { Field, Row2, Col, ErrorBox } from './bipShared';
import {
  inputStyle, sectionCard, optStyle, btn, ghostBtn, rowStyle, pageStyle, escapeHtml, fmt, fmtDate, toLocalInput, businessDaysDue, deadlineStatus, printHtml, DISCHARGE_LABELS, BIP_SESSION_TYPE,
} from '../lib/bipUi';

// BIP discharge workflow -- Florida Rule 65H-2.016(7), F.A.C.
// Three categories (completion, termination, transfer). On discharge: document the reason,
// notify the victim within 24 hours (the database starts that clock in Victim Notifications),
// and send a written discharge report to the referral source and probation/parole within
// 3 business days.

const REPORT_METHODS = { email: 'Email', mail: 'Mail', fax: 'Fax', hand_delivered: 'Hand delivered', electronic_filing: 'Electronic court filing' };

function blankForm(client) {
  return {
    client_program_id: '', discharge_at: toLocalInput(new Date().toISOString()), category: '', reason_details: '',
    transfer_program: '', referral_source_name: client?.referral_source || '', probation_applicable: false,
  };
}

export default function BipDischarges({ session }) {
  const [clients, setClients] = useState([]);
  const [openReports, setOpenReports] = useState([]);
  const [clientId, setClientId] = useState('');
  const [programs, setPrograms] = useState([]);
  const [discharges, setDischarges] = useState([]);
  const [form, setForm] = useState(null);
  const [sentForm, setSentForm] = useState(null); // { id, which: 'referral'|'probation', at, method }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const client = clients.find(c => c.id === clientId) || null;

  useEffect(() => { fetchOverview(); }, []);
  useEffect(() => {
    setForm(null); setSentForm(null); setError(null);
    if (clientId) fetchClient(clientId); else { setPrograms([]); setDischarges([]); }
  }, [clientId]);

  async function fetchOverview() {
    const [{ data: cs }, { data: open }] = await Promise.all([
      supabase.from('clients').select('id, name, enrollment_date, referral_source').eq('population_type', 'bip').order('name'),
      supabase.from('bip_discharges').select('*, clients(name)').or('referral_report_sent_at.is.null,and(probation_applicable.eq.true,probation_report_sent_at.is.null)').order('report_due_at'),
    ]);
    setClients(cs || []);
    setOpenReports(open || []);
  }

  async function fetchClient(id) {
    const [{ data: progs }, { data: ds }] = await Promise.all([
      supabase.from('client_programs').select('*').eq('client_id', id).order('created_at'),
      supabase.from('bip_discharges').select('*').eq('client_id', id).order('discharge_at', { ascending: false }),
    ]);
    setPrograms(progs || []);
    setDischarges(ds || []);
  }

  async function saveDischarge() {
    const f = form;
    if (!f.category) { setError('Choose completion, termination, or transfer.'); return; }
    if (!f.reason_details.trim()) { setError('Document the reason(s) for discharge (Rule 65H-2.016(7)(b)1).'); return; }
    if (f.category === 'transfer' && !f.transfer_program.trim()) { setError('Enter the program the participant is transferring to.'); return; }
    if (!f.discharge_at) { setError('Enter the discharge date and time.'); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from('bip_discharges').insert([{
      client_id: clientId,
      client_program_id: f.client_program_id || null,
      discharge_at: new Date(f.discharge_at).toISOString(),
      category: f.category,
      reason_details: f.reason_details.trim(),
      transfer_program: f.category === 'transfer' ? f.transfer_program.trim() : null,
      referral_source_name: f.referral_source_name.trim() || null,
      probation_applicable: f.probation_applicable,
      report_due_at: new Date().toISOString(), // recalculated by the database trigger
      created_by: session.user.id,
    }]);
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setForm(null);
    fetchClient(clientId);
    fetchOverview();
  }

  async function saveSent() {
    const s = sentForm;
    if (!s.at) { setError('Enter when the report was sent.'); return; }
    setSaving(true); setError(null);
    const payload = s.which === 'referral'
      ? { referral_report_sent_at: new Date(s.at).toISOString(), referral_report_method: s.method }
      : { probation_report_sent_at: new Date(s.at).toISOString(), probation_report_method: s.method };
    const { error: err } = await supabase.from('bip_discharges').update(payload).eq('id', s.id);
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setSentForm(null);
    fetchClient(clientId);
    fetchOverview();
  }

  async function printReport(d) {
    const program = programs.find(p => p.id === d.client_program_id);
    const { data: recs } = await supabase.from('service_records').select('attendance_status, service_date')
      .eq('client_id', d.client_id).eq('service_type', BIP_SESSION_TYPE);
    const count = s => (recs || []).filter(r => r.attendance_status === s).length;
    printHtml('BIP Discharge Report', `
      <h1>Batterers' Intervention Program: Discharge Report</h1>
      <div class="field"><span class="label">Participant: </span>${escapeHtml(client?.name)}</div>
      ${program ? `<div class="field"><span class="label">Program / order: </span>${escapeHtml(program.order_name)}</div>` : ''}
      <div class="field"><span class="label">Enrollment date: </span>${escapeHtml(fmtDate(client?.enrollment_date) || 'Not recorded')}</div>
      <div class="field"><span class="label">Discharge date: </span>${escapeHtml(fmt(d.discharge_at))}</div>
      <div class="field"><span class="label">Discharge category: </span>${escapeHtml(DISCHARGE_LABELS[d.category])}</div>
      ${d.category === 'transfer' ? `<div class="field"><span class="label">Transferred to: </span>${escapeHtml(d.transfer_program)}</div>` : ''}
      <h2>Reason(s) for discharge</h2>
      <div class="field">${escapeHtml(d.reason_details).replace(/\n/g, '<br>')}</div>
      <h2>Group session attendance</h2>
      <table><tr><th>Attended</th><th>Made up</th><th>Excused</th><th>Missed</th></tr>
      <tr><td>${count('attended')}</td><td>${count('made_up')}</td><td>${count('excused')}</td><td>${count('missed')}</td></tr></table>
      <h2>Sent to</h2>
      <div class="field"><span class="label">Referral source: </span>${escapeHtml(d.referral_source_name || '')}</div>
      <div class="field"><span class="label">Probation and parole: </span>${d.probation_applicable ? 'Yes' : 'Not applicable'}</div>
      <div class="note">Rule 65H-2.016(7)(b), F.A.C., requires this written notice to the referral source, and to probation and parole if applicable, within three business days of discharge. Deadline for this report: ${escapeHtml(fmt(d.report_due_at))}.</div>
      <div class="sig">Program representative: ______________________________ &nbsp; Date: ______________</div>
    `);
  }

  const f = form;

  return (
    <div style={pageStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>BIP Discharges</h2>
      <div style={{ color: TEXT_MUTED, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
        Rule 65H-2.016(7): every discharge is a completion, termination, or transfer. The written discharge report goes to the referral source (and probation and parole, if applicable) within <strong>3 business days</strong>. Saving a discharge also starts the <strong>24-hour</strong> victim notice clock on the Victim Notifications screen.
      </div>
      <ErrorBox error={error} />

      <div style={sectionCard}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Discharge reports due</div>
        {openReports.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: 13.5 }}>No discharge reports outstanding.</div>}
        {openReports.map(d => {
          const s = deadlineStatus(d.report_due_at, null);
          return (
            <div key={d.id} style={{ ...rowStyle, cursor: 'pointer' }} onClick={() => setClientId(d.client_id)}>
              <span><strong>{d.clients?.name}</strong> · {DISCHARGE_LABELS[d.category]} {fmtDate(d.discharge_at)}</span>
              <span style={{ color: s.color }}>{s.label} · due {fmt(d.report_due_at)}</span>
            </div>
          );
        })}
      </div>

      <div style={sectionCard}>
        <Field label="BIP participant">
          <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
            <option value="" style={optStyle}>Select a participant</option>
            {clients.map(c => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
          </select>
        </Field>
        {clients.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No BIP participants found. A participant appears here when their program type is set to BIP.</div>}
      </div>

      {client && (
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
            <div style={{ fontWeight: 700 }}>Discharges</div>
            {!f && <button style={ghostBtn} onClick={() => { setForm(blankForm(client)); setError(null); }}>Discharge participant</button>}
          </div>
          {discharges.length === 0 && !f && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No discharge recorded.</div>}
          {discharges.map(d => {
            const ref = deadlineStatus(d.report_due_at, d.referral_report_sent_at);
            const prob = d.probation_applicable ? deadlineStatus(d.report_due_at, d.probation_report_sent_at) : null;
            return (
              <div key={d.id} style={{ ...rowStyle, alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div><strong>{DISCHARGE_LABELS[d.category]}</strong> · {fmt(d.discharge_at)}{d.category === 'transfer' && ` · to ${d.transfer_program}`}</div>
                  <div style={{ color: TEXT_DIM, fontSize: 12.5, marginTop: 4 }}>
                    Referral source report: <span style={{ color: ref.color }}>{ref.label}</span>{d.referral_report_sent_at && ` (${fmt(d.referral_report_sent_at)}, ${REPORT_METHODS[d.referral_report_method]})`}
                  </div>
                  <div style={{ color: TEXT_DIM, fontSize: 12.5 }}>
                    Probation report: {prob ? <><span style={{ color: prob.color }}>{prob.label}</span>{d.probation_report_sent_at && ` (${fmt(d.probation_report_sent_at)}, ${REPORT_METHODS[d.probation_report_method]})`}</> : 'Not applicable'}
                  </div>
                  <div style={{ color: TEXT_DIM, fontSize: 12.5 }}>Report due {fmt(d.report_due_at)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button style={ghostBtn} onClick={() => printReport(d)}>Print discharge report</button>
                  {!d.referral_report_sent_at && <button style={ghostBtn} onClick={() => setSentForm({ id: d.id, which: 'referral', at: toLocalInput(new Date().toISOString()), method: 'email' })}>Mark sent to referral source</button>}
                  {d.probation_applicable && !d.probation_report_sent_at && <button style={ghostBtn} onClick={() => setSentForm({ id: d.id, which: 'probation', at: toLocalInput(new Date().toISOString()), method: 'email' })}>Mark sent to probation</button>}
                </div>
                {sentForm && sentForm.id === d.id && (
                  <div style={{ flexBasis: '100%', marginTop: 10 }}>
                    <Row2>
                      <Col><Field label={`Sent to ${sentForm.which === 'referral' ? 'referral source' : 'probation and parole'}`}>
                        <input type="datetime-local" style={inputStyle} value={sentForm.at} onChange={e => setSentForm({ ...sentForm, at: e.target.value })} /></Field></Col>
                      <Col><Field label="How">
                        <select style={inputStyle} value={sentForm.method} onChange={e => setSentForm({ ...sentForm, method: e.target.value })}>
                          {Object.entries(REPORT_METHODS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}
                        </select></Field></Col>
                    </Row2>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={btn()} disabled={saving} onClick={saveSent}>{saving ? 'Saving...' : 'Save'}</button>
                      <button style={ghostBtn} onClick={() => setSentForm(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {f && (
            <div style={{ marginTop: 16 }}>
              <Row2>
                <Col><Field label="Discharge date and time *"><input type="datetime-local" style={inputStyle} value={f.discharge_at} onChange={e => setForm({ ...f, discharge_at: e.target.value })} /></Field></Col>
                <Col><Field label="Category *">
                  <select style={inputStyle} value={f.category} onChange={e => setForm({ ...f, category: e.target.value })}>
                    <option value="" style={optStyle}>Select</option>
                    <option value="completion" style={optStyle}>Completion</option>
                    <option value="termination" style={optStyle}>Termination</option>
                    <option value="transfer" style={optStyle}>Transfer</option>
                  </select></Field></Col>
                {programs.length > 0 && <Col><Field label="Program / court order">
                  <select style={inputStyle} value={f.client_program_id} onChange={e => setForm({ ...f, client_program_id: e.target.value })}>
                    <option value="" style={optStyle}>Not linked</option>
                    {programs.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id} style={optStyle}>{p.order_name}</option>)}
                  </select></Field></Col>}
              </Row2>
              <div style={{ color: TEXT_DIM, fontSize: 12.5, marginBottom: 12, lineHeight: 1.5 }}>
                {f.category === 'completion' && 'Completion: completed the assessment, followed program rules and contract, participated at an acceptable level, and paid required fees (65H-2.016(7)(a)1).'}
                {f.category === 'termination' && 'Termination: not appropriate for the program under the screening criteria, or did not meet the program requirements (65H-2.016(7)(a)2).'}
                {f.category === 'transfer' && 'Transfer: approved to transfer to another program. Record the approvals and the 48-hour file transfer on the Participant File screen (65H-2.016(7)(a)3, (5)(c)).'}
              </div>
              {f.category === 'transfer' && <Field label="Transferring to (program name) *"><input style={inputStyle} value={f.transfer_program} onChange={e => setForm({ ...f, transfer_program: e.target.value })} /></Field>}
              <NotesWarning />
              <Field label="Reason(s) for discharge *"><textarea style={{ ...inputStyle, minHeight: 90 }} value={f.reason_details} onChange={e => setForm({ ...f, reason_details: e.target.value })} /></Field>
              <Row2>
                <Col grow={2}><Field label="Referral source (who gets the discharge report)"><input style={inputStyle} value={f.referral_source_name} onChange={e => setForm({ ...f, referral_source_name: e.target.value })} placeholder="e.g. 12th Circuit, Judge Smith" /></Field></Col>
                <Col><label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, marginTop: 26, cursor: 'pointer' }}>
                  <input type="checkbox" checked={f.probation_applicable} onChange={e => setForm({ ...f, probation_applicable: e.target.checked })} />
                  On probation or parole
                </label></Col>
              </Row2>
              {f.discharge_at && <div style={{ color: WARNING, fontSize: 12.5, marginBottom: 12 }}>
                Discharge report due {businessDaysDue(new Date(f.discharge_at), 3).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}. Victim notice due {fmt(new Date(new Date(f.discharge_at).getTime() + 86400000).toISOString())}.
              </div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn()} disabled={saving} onClick={saveDischarge}>{saving ? 'Saving...' : 'Save discharge'}</button>
                <button style={ghostBtn} onClick={() => setForm(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
