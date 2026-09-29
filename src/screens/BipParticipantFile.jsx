import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';
import { participantFileChecks, attendanceProgress } from '../lib/bipRules';
import { Field, Row2, Col, ErrorBox } from './bipShared';
import {
  inputStyle, sectionCard, optStyle, btn, ghostBtn, rowStyle, pageStyle, escapeHtml, fmt, fmtDate, today, toLocalInput, deadlineStatus, printHtml, BIP_SESSION_TYPE, BIP_MIN_SESSIONS, BIP_MIN_WEEKS,
} from '../lib/bipUi';

// BIP participant file -- intake checklist, attendance progress and make-ups, fee payments,
// transfers, and a DCF Participant File Review readiness check. Florida Rule 65H-2.016(5),
// (6), (9)(c), F.A.C.

const BLANK_INTAKE = {
  file_number: '', county_of_residence: '', photo_id_on_file: false, court_order_on_file: false, police_report_on_file: 'no',
  rules_explained_at: '', enrollment_form_completed_at: '', prior_bip_enrollment: false, eligibility_screened_at: '', eligibility_result: '',
  orientation_attended_at: '', orientation_ack_signed: false, assessment_completed_at: '', assessment_recommendation: '',
  financial_assessment_at: '', fee_reduced_or_waived: false, limited_english: false, lep_how_addressed: '',
};
const INTAKE_DATES = ['rules_explained_at', 'enrollment_form_completed_at', 'eligibility_screened_at', 'orientation_attended_at', 'assessment_completed_at', 'financial_assessment_at'];
const FEE_METHODS = { cash: 'Cash', card: 'Card', check: 'Check', money_order: 'Money order', other: 'Other' };

function blankTransfer() {
  return { id: null, direction: 'outgoing', other_program: '', referral_source_approved_at: '', probation_approval: 'pending', probation_approved_at: '', program_director_approved_at: '', file_sent_at: '', file_received_at: '' };
}

export default function BipParticipantFile({ session }) {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [intake, setIntake] = useState(null);       // saved row or null
  const [intakeForm, setIntakeForm] = useState(BLANK_INTAKE);
  const [sessions, setSessions] = useState([]);
  const [fees, setFees] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [notices, setNotices] = useState([]);
  const [discharges, setDischarges] = useState([]);
  const [violations, setViolations] = useState([]);
  const [maxUnexcused, setMaxUnexcused] = useState(null);
  const [feeForm, setFeeForm] = useState(null);
  const [transferForm, setTransferForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');

  const client = clients.find(c => c.id === clientId) || null;

  useEffect(() => { init(); }, []);
  useEffect(() => {
    setFeeForm(null); setTransferForm(null); setError(null); setSavedMsg('');
    if (clientId) fetchClient(clientId);
  }, [clientId]);

  async function init() {
    const [{ data: cs }, { data: me }] = await Promise.all([
      supabase.from('clients').select('id, name, enrollment_date, provider_id').eq('population_type', 'bip').order('name'),
      supabase.from('profiles').select('bip_max_unexcused_absences').eq('id', session.user.id).single(),
    ]);
    setClients(cs || []);
    setMaxUnexcused(me?.bip_max_unexcused_absences ?? null);
  }

  async function fetchClient(id) {
    const [{ data: ik }, { data: ss }, { data: fs }, { data: ts }, { data: ns }, { data: ds }, { data: vs }] = await Promise.all([
      supabase.from('bip_intake').select('*').eq('client_id', id).maybeSingle(),
      supabase.from('service_records').select('*').eq('client_id', id).eq('service_type', BIP_SESSION_TYPE).order('service_date', { ascending: false }),
      supabase.from('bip_fee_payments').select('*').eq('client_id', id).order('paid_on', { ascending: false }),
      supabase.from('bip_transfers').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('victim_notifications').select('*').eq('client_id', id),
      supabase.from('bip_discharges').select('*').eq('client_id', id).order('discharge_at', { ascending: false }),
      supabase.from('violation_reports').select('id, status, submitted_to, restricted, report_date').eq('client_id', id),
    ]);
    setIntake(ik || null);
    const next = { ...BLANK_INTAKE };
    if (ik) for (const k of Object.keys(BLANK_INTAKE)) next[k] = ik[k] ?? BLANK_INTAKE[k];
    setIntakeForm(next);
    setSessions(ss || []);
    setFees(fs || []);
    setTransfers(ts || []);
    setNotices(ns || []);
    setDischarges(ds || []);
    setViolations(vs || []);
  }

  async function saveIntake() {
    setSaving(true); setError(null); setSavedMsg('');
    const payload = { ...intakeForm, client_id: clientId, updated_by: session.user.id, updated_at: new Date().toISOString() };
    for (const k of INTAKE_DATES) payload[k] = intakeForm[k] || null;
    payload.eligibility_result = intakeForm.eligibility_result || null;
    payload.assessment_recommendation = intakeForm.assessment_recommendation || null;
    let err;
    if (intake) ({ error: err } = await supabase.from('bip_intake').update(payload).eq('client_id', clientId));
    else ({ error: err } = await supabase.from('bip_intake').insert([{ ...payload, created_by: session.user.id }]));
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setSavedMsg('Participant file saved.');
    fetchClient(clientId);
  }

  async function recordMakeUp(missedRecord) {
    setError(null);
    const date = window.prompt('Date the missed session was made up (YYYY-MM-DD):', today());
    if (!date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError('Use the format YYYY-MM-DD.'); return; }
    const { error: err } = await supabase.from('service_records').insert([{
      client_id: clientId, client_program_id: missedRecord.client_program_id, provider_id: session.user.id, entered_by: session.user.id,
      service_type: BIP_SESSION_TYPE, service_date: date, units: 1.5, attendance_status: 'made_up', compliance_status: 'compliant',
      made_up_for_record_id: missedRecord.id, event_notes: `Make-up for missed session on ${missedRecord.service_date}`,
    }]);
    if (err) { setError('Could not save the make-up: ' + err.message); return; }
    fetchClient(clientId);
  }

  async function saveFee() {
    const amount = parseFloat(feeForm.amount);
    if (!amount || (feeForm.entry_type === 'payment' && amount <= 0)) { setError('Enter a payment amount greater than 0. Use a correction (negative amount) to reverse a mistake.'); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from('bip_fee_payments').insert([{
      client_id: clientId, paid_on: feeForm.paid_on, amount, method: feeForm.method || null, entry_type: feeForm.entry_type,
      note: feeForm.note.trim() || null, created_by: session.user.id,
    }]);
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setFeeForm(null);
    fetchClient(clientId);
  }

  async function saveTransfer() {
    const t = transferForm;
    if (!t.other_program.trim()) { setError('Enter the other program.'); return; }
    setSaving(true); setError(null);
    const payload = {
      client_id: clientId, direction: t.direction, other_program: t.other_program.trim(),
      referral_source_approved_at: t.referral_source_approved_at || null, probation_approval: t.probation_approval,
      probation_approved_at: t.probation_approval === 'approved' ? (t.probation_approved_at || null) : null,
      program_director_approved_at: t.program_director_approved_at || null,
      file_sent_at: t.direction === 'outgoing' && t.file_sent_at ? new Date(t.file_sent_at).toISOString() : null,
      file_received_at: t.direction === 'incoming' && t.file_received_at ? new Date(t.file_received_at).toISOString() : null,
    };
    let err;
    if (t.id) ({ error: err } = await supabase.from('bip_transfers').update(payload).eq('id', t.id));
    else ({ error: err } = await supabase.from('bip_transfers').insert([{ ...payload, created_by: session.user.id }]));
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setTransferForm(null);
    fetchClient(clientId);
  }

  const latestDischarge = discharges[0] || null;
  const checks = client ? participantFileChecks({ intake, notices, discharge: latestDischarge, sessions, fees, violations }) : [];
  const failing = checks.filter(c => c.ok === false);
  const progress = attendanceProgress(sessions, client?.enrollment_date, maxUnexcused);
  const feeTotal = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const incomingPending = transfers.some(t => t.direction === 'incoming' && !t.approved_at);
  const retentionUntil = latestDischarge ? new Date(new Date(latestDischarge.discharge_at).setFullYear(new Date(latestDischarge.discharge_at).getFullYear() + 5)) : null;

  function printReadiness() {
    printHtml('Participant File Review', `
      <h1>Participant File Review: ${escapeHtml(client?.name)}</h1>
      <div class="field"><span class="label">File number: </span>${escapeHtml(intake?.file_number || '')}</div>
      <div class="field"><span class="label">Enrollment date: </span>${escapeHtml(fmtDate(client?.enrollment_date))}</div>
      <table><tr><th>DCF Participant File Review item</th><th>Rule</th><th>Status</th></tr>
      ${checks.map(c => `<tr><td>${escapeHtml(c.item)}</td><td>${escapeHtml(c.rule)}</td><td>${c.ok === null ? 'N/A' : c.ok ? 'Yes' : '<b>No</b>'}</td></tr>`).join('')}
      </table>
      <div class="note">Items follow the DCF BIP Participant File Review Checklist (Office of Domestic Violence monitoring tool). Victim contact information is never included in this report (Rule 65H-2.016(8)(d)).</div>
    `);
  }

  const f = intakeForm;
  const set = (k, v) => setIntakeForm({ ...f, [k]: v });
  const check = (k, label) => (
    <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, marginBottom: 10, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!f[k]} onChange={e => set(k, e.target.checked)} /> {label}
    </label>
  );
  const dateField = (k, label) => <Col min={180}><Field label={label}><input type="date" style={inputStyle} value={f[k]} onChange={e => set(k, e.target.value)} /></Field></Col>;

  return (
    <div style={pageStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>BIP Participant File</h2>
      <div style={{ color: TEXT_MUTED, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
        Everything DCF checks in a participant file during monitoring: intake, attendance and make-ups, fees, transfers, and notices. Files are kept at least 5 years after discharge (Rule 65H-2.016(9)(c)).
      </div>
      <ErrorBox error={error} />

      <div style={sectionCard}>
        <Field label="BIP participant">
          <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
            <option value="" style={optStyle}>Select a participant</option>
            {clients.map(c => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
          </select>
        </Field>
        {clients.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No BIP participants found. A participant appears here when their program type is set to BIP.</div>}
      </div>

      {client && <>
        {/* READINESS */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>DCF file review: {failing.length === 0 ? <span style={{ color: GREEN }}>ready</span> : <span style={{ color: WARNING }}>{failing.length} item{failing.length === 1 ? '' : 's'} missing</span>}</div>
            <button style={ghostBtn} onClick={printReadiness}>Print file review</button>
          </div>
          {failing.map(c => <div key={c.item} style={{ fontSize: 13, color: TEXT_MUTED, padding: '3px 0' }}>• {c.item} <span style={{ color: TEXT_DIM }}>({c.rule})</span></div>)}
          {retentionUntil && <div style={{ fontSize: 12.5, color: TEXT_DIM, marginTop: 10 }}>Records must be kept until at least {retentionUntil.toLocaleDateString()}.</div>}
        </div>

        {/* INTAKE */}
        <div style={sectionCard}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Intake and file checklist</div>
          {f.prior_bip_enrollment && incomingPending && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>This participant was in another BIP. Rule 65H-2.016(5)(c) says they can't be enrolled until the referral source, probation (if applicable), and the other program's director approve the transfer by email. See Transfers below.</div>}
          <Row2>
            <Col min={160}><Field label="File number"><input style={inputStyle} value={f.file_number} onChange={e => set('file_number', e.target.value)} /></Field></Col>
            <Col min={160}><Field label="County of residence"><input style={inputStyle} value={f.county_of_residence} onChange={e => set('county_of_residence', e.target.value)} /></Field></Col>
            <Col min={160}><Field label="Police report in file">
              <select style={inputStyle} value={f.police_report_on_file} onChange={e => set('police_report_on_file', e.target.value)}>
                <option value="yes" style={optStyle}>Yes (redacted)</option><option value="no" style={optStyle}>No</option><option value="not_applicable" style={optStyle}>Not applicable</option>
              </select></Field></Col>
          </Row2>
          <Row2>
            <Col>{check('photo_id_on_file', 'Government photo ID copy in file')}{check('court_order_on_file', 'Court order in file')}</Col>
            <Col>{check('prior_bip_enrollment', 'Was or is enrolled in another certified BIP')}{check('orientation_ack_signed', 'Signed orientation acknowledgment in file')}</Col>
          </Row2>
          <Row2>
            {dateField('rules_explained_at', 'Fees, rules, expectations explained')}
            {dateField('enrollment_form_completed_at', 'Enrollment form completed')}
            {dateField('orientation_attended_at', 'Orientation attended')}
          </Row2>
          <Row2>
            {dateField('eligibility_screened_at', 'Eligibility screening')}
            <Col min={180}><Field label="Screening result">
              <select style={inputStyle} value={f.eligibility_result} onChange={e => set('eligibility_result', e.target.value)}>
                <option value="" style={optStyle}>Select</option><option value="eligible" style={optStyle}>Eligible (intimate partner violence)</option><option value="not_eligible" style={optStyle}>Not eligible</option>
              </select></Field></Col>
            {dateField('financial_assessment_at', 'Financial assessment')}
          </Row2>
          <Row2>
            {dateField('assessment_completed_at', 'Assessment completed')}
            <Col min={180}><Field label="Assessment recommended treatment">
              <select style={inputStyle} value={f.assessment_recommendation} onChange={e => set('assessment_recommendation', e.target.value)}>
                <option value="" style={optStyle}>Select</option><option value="none" style={optStyle}>None</option><option value="mental_health" style={optStyle}>Mental health</option>
                <option value="substance_abuse" style={optStyle}>Substance abuse</option><option value="both" style={optStyle}>Both</option>
              </select></Field></Col>
            <Col min={180}><div style={{ paddingTop: 24 }}>{check('fee_reduced_or_waived', 'Fee reduced or waived (indigent)')}</div></Col>
          </Row2>
          {check('limited_english', 'Limited English proficiency')}
          {f.limited_english && <>
            <NotesWarning />
            <Field label="How LEP was addressed (interpreter, language line, referral) (65H-2.016(6)(h))">
              <textarea style={{ ...inputStyle, minHeight: 60 }} value={f.lep_how_addressed} onChange={e => set('lep_how_addressed', e.target.value)} /></Field>
          </>}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button style={btn()} disabled={saving} onClick={saveIntake}>{saving ? 'Saving...' : 'Save file checklist'}</button>
            {savedMsg && <span style={{ color: GREEN, fontSize: 13 }}>{savedMsg}</span>}
          </div>
        </div>

        {/* ATTENDANCE */}
        <div style={sectionCard}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Attendance</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13.5, marginBottom: 10 }}>
            <span>Sessions credited: <strong style={{ color: progress.credited >= BIP_MIN_SESSIONS ? GREEN : TEXT }}>{progress.credited} / {BIP_MIN_SESSIONS}</strong></span>
            <span>Weeks in program: <strong style={{ color: progress.weeks >= BIP_MIN_WEEKS ? GREEN : TEXT }}>{progress.weeks ?? '?'} / {BIP_MIN_WEEKS}</strong></span>
            <span>Missed: <strong style={{ color: progress.overUnexcusedLimit ? RED : progress.atUnexcusedLimit ? WARNING : TEXT }}>{progress.missedTotal}{maxUnexcused != null && ` (limit ${maxUnexcused})`}</strong></span>
          </div>
          {maxUnexcused == null && <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 8 }}>Set your program's maximum unexcused absences on the BIP Groups screen (Rule 65H-2.016(6)(c)).</div>}
          {progress.overUnexcusedLimit && <div style={{ fontSize: 13, color: RED, marginBottom: 8 }}>Over the program's unexcused absence limit. Under your policy this participant may be terminated.</div>}
          <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 8 }}>Minimum program: 24 weekly sessions of 1.5 hours over at least 29 weeks (Rule 65H-2.016(6)(b)). Record group attendance on the BIP Groups screen.</div>
          {progress.outstandingMissed.map(s => (
            <div key={s.id} style={rowStyle}>
              <span>Missed {fmtDate(s.service_date)} · not made up</span>
              <button style={ghostBtn} onClick={() => recordMakeUp(s)}>Record make-up</button>
            </div>
          ))}
          {sessions.slice(0, 8).map(s => (
            <div key={`s-${s.id}`} style={{ ...rowStyle, color: TEXT_MUTED }}>
              <span>{fmtDate(s.service_date)}</span><span>{s.attendance_status === 'made_up' ? 'Made up' : s.attendance_status}</span>
            </div>
          ))}
          {sessions.length > 8 && <div style={{ fontSize: 12.5, color: TEXT_DIM, marginTop: 6 }}>Showing the 8 most recent of {sessions.length} sessions.</div>}
        </div>

        {/* FEES */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Fee payments <span style={{ color: TEXT_MUTED, fontWeight: 400 }}>· total ${feeTotal.toFixed(2)}</span></div>
            {!feeForm && <button style={ghostBtn} onClick={() => { setFeeForm({ paid_on: today(), amount: '', method: 'cash', entry_type: 'payment', note: '' }); setError(null); }}>Record payment</button>}
          </div>
          {fees.length === 0 && !feeForm && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No payments recorded.</div>}
          {fees.map(p => (
            <div key={p.id} style={rowStyle}>
              <span>{fmtDate(p.paid_on)} · {p.entry_type === 'correction' ? 'Correction' : FEE_METHODS[p.method] || 'Payment'}{p.note && <span style={{ color: TEXT_DIM }}> · {p.note}</span>}</span>
              <span style={{ color: p.amount < 0 ? RED : TEXT }}>${Number(p.amount).toFixed(2)}</span>
            </div>
          ))}
          {feeForm && (
            <div style={{ marginTop: 12 }}>
              <Row2>
                <Col min={150}><Field label="Type"><select style={inputStyle} value={feeForm.entry_type} onChange={e => setFeeForm({ ...feeForm, entry_type: e.target.value })}>
                  <option value="payment" style={optStyle}>Payment</option><option value="correction" style={optStyle}>Correction</option></select></Field></Col>
                <Col min={150}><Field label="Date"><input type="date" style={inputStyle} value={feeForm.paid_on} onChange={e => setFeeForm({ ...feeForm, paid_on: e.target.value })} /></Field></Col>
                <Col min={150}><Field label={feeForm.entry_type === 'correction' ? 'Amount (negative to reverse)' : 'Amount'}><input type="number" step="0.01" style={inputStyle} value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} /></Field></Col>
                {feeForm.entry_type === 'payment' && <Col min={150}><Field label="Method"><select style={inputStyle} value={feeForm.method} onChange={e => setFeeForm({ ...feeForm, method: e.target.value })}>
                  {Object.entries(FEE_METHODS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}</select></Field></Col>}
              </Row2>
              <Field label="Note (optional)"><input style={inputStyle} value={feeForm.note} onChange={e => setFeeForm({ ...feeForm, note: e.target.value })} /></Field>
              <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 10 }}>Payments can't be edited or deleted. Fix a mistake with a correction entry.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn()} disabled={saving} onClick={saveFee}>{saving ? 'Saving...' : 'Save'}</button>
                <button style={ghostBtn} onClick={() => setFeeForm(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* TRANSFERS */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Transfers</div>
            {!transferForm && <button style={ghostBtn} onClick={() => { setTransferForm(blankTransfer()); setError(null); }}>Add transfer</button>}
          </div>
          <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 10, lineHeight: 1.5 }}>Rule 65H-2.016(5)(c): a transfer needs written approval by email from the referral source, probation and parole (if applicable), and the director of the program the participant was in. Once approved, that program sends an electronic copy of the file within 48 hours.</div>
          {transfers.length === 0 && !transferForm && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No transfers.</div>}
          {transfers.map(t => {
            const fileStatus = t.direction === 'outgoing' && t.file_due_at ? deadlineStatus(t.file_due_at, t.file_sent_at) : null;
            return (
              <div key={t.id} style={rowStyle}>
                <div>
                  <div><strong>{t.direction === 'outgoing' ? 'To' : 'From'} {t.other_program}</strong> · {t.approved_at ? <span style={{ color: GREEN }}>approved</span> : <span style={{ color: WARNING }}>waiting on approvals</span>}</div>
                  {fileStatus && <div style={{ fontSize: 12.5, color: TEXT_DIM }}>File to new program: <span style={{ color: fileStatus.color }}>{fileStatus.label}</span> · due {fmt(t.file_due_at)}</div>}
                  {t.direction === 'incoming' && t.approved_at && <div style={{ fontSize: 12.5, color: TEXT_DIM }}>File received: {t.file_received_at ? fmt(t.file_received_at) : 'not yet'}</div>}
                </div>
                <button style={ghostBtn} onClick={() => setTransferForm({
                  ...blankTransfer(), ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v ?? ''])),
                  file_sent_at: toLocalInput(t.file_sent_at), file_received_at: toLocalInput(t.file_received_at),
                })}>Update</button>
              </div>
            );
          })}
          {transferForm && (
            <div style={{ marginTop: 12 }}>
              <Row2>
                <Col min={160}><Field label="Direction"><select style={inputStyle} value={transferForm.direction} onChange={e => setTransferForm({ ...transferForm, direction: e.target.value })}>
                  <option value="outgoing" style={optStyle}>Leaving us for another program</option><option value="incoming" style={optStyle}>Coming to us from another program</option></select></Field></Col>
                <Col grow={2}><Field label="Other program *"><input style={inputStyle} value={transferForm.other_program} onChange={e => setTransferForm({ ...transferForm, other_program: e.target.value })} /></Field></Col>
              </Row2>
              <Row2>
                <Col min={170}><Field label="Referral source approved (email)"><input type="date" style={inputStyle} value={transferForm.referral_source_approved_at} onChange={e => setTransferForm({ ...transferForm, referral_source_approved_at: e.target.value })} /></Field></Col>
                <Col min={170}><Field label="Probation and parole"><select style={inputStyle} value={transferForm.probation_approval} onChange={e => setTransferForm({ ...transferForm, probation_approval: e.target.value })}>
                  <option value="pending" style={optStyle}>Waiting</option><option value="approved" style={optStyle}>Approved</option><option value="not_applicable" style={optStyle}>Not applicable</option></select></Field></Col>
                {transferForm.probation_approval === 'approved' && <Col min={170}><Field label="Probation approved on"><input type="date" style={inputStyle} value={transferForm.probation_approved_at} onChange={e => setTransferForm({ ...transferForm, probation_approved_at: e.target.value })} /></Field></Col>}
                <Col min={170}><Field label={`${transferForm.direction === 'outgoing' ? 'Our' : 'Other'} program director approved`}><input type="date" style={inputStyle} value={transferForm.program_director_approved_at} onChange={e => setTransferForm({ ...transferForm, program_director_approved_at: e.target.value })} /></Field></Col>
              </Row2>
              {transferForm.direction === 'outgoing'
                ? <Field label="File sent to the new program"><input type="datetime-local" style={{ ...inputStyle, maxWidth: 280 }} value={transferForm.file_sent_at} onChange={e => setTransferForm({ ...transferForm, file_sent_at: e.target.value })} /></Field>
                : <Field label="File received from the other program"><input type="datetime-local" style={{ ...inputStyle, maxWidth: 280 }} value={transferForm.file_received_at} onChange={e => setTransferForm({ ...transferForm, file_received_at: e.target.value })} /></Field>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn()} disabled={saving} onClick={saveTransfer}>{saving ? 'Saving...' : 'Save transfer'}</button>
                <button style={ghostBtn} onClick={() => setTransferForm(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </>}
    </div>
  );
}
