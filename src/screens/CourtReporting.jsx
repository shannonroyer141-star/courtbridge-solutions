import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';

const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14, width: '100%' };
const labelStyle = { fontSize: 12, color: TEXT_MUTED, marginBottom: 4, display: 'block' };
const sectionCard = { background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 20 };

const COMPLIANCE_COLORS = {
  compliant: GREEN,
  noncompliant: RED,
  pending_review: WARNING,
};

const COURT_TYPE_LABELS = {
  drug_court: 'Drug Court', mental_health_court: 'Mental Health Court',
  veterans_treatment_court: 'Veterans Treatment Court', early_childhood_court: 'Early Childhood Court', other: 'Other',
};

function Field({ label, children }) {
  return <div style={{ marginBottom: 4 }}><span style={labelStyle}>{label}</span>{children}</div>;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeCsv(val) {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(escapeCsv).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CourtReporting() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [client, setClient] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [records, setRecords] = useState([]);
  const [entryForm, setEntryForm] = useState(null);
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryError, setEntryError] = useState(null);

  const [exitProgramId, setExitProgramId] = useState('');
  const [exitForm, setExitForm] = useState(null);
  const [savingExit, setSavingExit] = useState(false);
  const [exitError, setExitError] = useState(null);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordForm, setRecordForm] = useState(blankRecord());
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordError, setRecordError] = useState(null);
  const [exporting, setExporting] = useState(false);

  function blankRecord() {
    return { service_type: '', service_date: new Date().toISOString().split('T')[0], units: '', attendance_status: 'attended', event_notes: '', compliance_status: 'pending_review', reason_noncompliance: '', new_offense_reported: false, new_offense_details: '', documentation_url: '' };
  }

  useEffect(() => { fetchClients(); }, []);
  useEffect(() => { if (clientId) fetchClientData(clientId); else { setClient(null); setPrograms([]); setRecords([]); } }, [clientId]);

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function fetchClientData(id) {
    const [{ data: c }, { data: progs }, { data: recs }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('client_programs').select('*').eq('client_id', id).order('created_at'),
      supabase.from('service_records').select('*').eq('client_id', id).order('service_date', { ascending: false }),
    ]);
    setClient(c || null);
    setEntryForm(c ? {
      referral_source: c.referral_source || '', primary_offense: c.primary_offense || '', screening_result: c.screening_result || '',
      eligibility_determination: c.eligibility_determination || '', employment_status_admission: c.employment_status_admission || '',
      housing_status_admission: c.housing_status_admission || '', custody_status_admission: c.custody_status_admission || '',
    } : null);
    setPrograms(progs || []);
    setRecords(recs || []);
    setExitProgramId(progs && progs.length > 0 ? progs[0].id : '');
  }

  useEffect(() => {
    const p = programs.find(p => p.id === exitProgramId);
    setExitForm(p ? {
      court_program_type: p.court_program_type || '', termination_reason: p.termination_reason || '',
      employment_status_exit: p.employment_status_exit || '', housing_status_exit: p.housing_status_exit || '',
      custody_status_exit: p.custody_status_exit || '', total_services_completed: p.total_services_completed ?? '', total_units_completed: p.total_units_completed ?? '',
    } : null);
  }, [exitProgramId, programs]);

  async function saveEntry() {
    setSavingEntry(true);
    setEntryError(null);
    const { error } = await supabase.from('clients').update(entryForm).eq('id', clientId);
    setSavingEntry(false);
    if (error) { setEntryError('Could not save: ' + error.message); return; }
    fetchClientData(clientId);
  }

  async function saveExit() {
    if (!exitProgramId) return;
    setSavingExit(true);
    setExitError(null);
    const payload = {
      ...exitForm,
      total_services_completed: exitForm.total_services_completed === '' ? null : parseInt(exitForm.total_services_completed, 10),
      total_units_completed: exitForm.total_units_completed === '' ? null : parseFloat(exitForm.total_units_completed),
    };
    const { error } = await supabase.from('client_programs').update(payload).eq('id', exitProgramId);
    setSavingExit(false);
    if (error) { setExitError('Could not save: ' + error.message); return; }
    fetchClientData(clientId);
  }

  async function saveRecord() {
    if (!recordForm.service_type.trim()) return;
    setSavingRecord(true);
    setRecordError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      ...recordForm,
      client_id: clientId,
      client_program_id: exitProgramId || null,
      provider_id: user.id,
      entered_by: user.id,
      units: recordForm.units === '' ? null : parseFloat(recordForm.units),
    };
    const { error } = await supabase.from('service_records').insert([payload]);
    setSavingRecord(false);
    if (error) { setRecordError('Could not save: ' + error.message); return; }
    setRecordForm(blankRecord());
    setShowRecordForm(false);
    fetchClientData(clientId);
  }

  function printComplianceSummary() {
    if (!client) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Participant Compliance Summary</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:750px;margin:0 auto;}h1{color:#1B3A6B;border-bottom:3px solid #1B3A6B;padding-bottom:12px;font-size:20px;}h2{color:#1B3A6B;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;margin-top:22px;}.field{margin-bottom:8px;}.label{font-weight:bold;color:#555;font-size:12.5px;}.val{color:#222;font-size:14px;}table{width:100%;border-collapse:collapse;margin-top:8px;}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12.5px;text-align:left;}th{background:#f2f2f2;}.footer{margin-top:36px;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#888;}.note{background:#eef4fb;border-left:4px solid #1B3A6B;padding:10px 14px;font-size:12px;color:#333;margin:16px 0;}</style>
      </head><body>
      <h1>Participant Compliance Summary</h1>
      <div class="note">Prepared by CourtBridge Solutions. Internal provider record — not an official OSCA submission or certification of compliance. Limited to enrollment, attendance, requirements completed, compliance status, and discharge status — no participant history, offense, or personal-status detail is included.</div>
      <div class="field"><span class="label">Generated: </span><span class="val">${new Date().toLocaleString()}</span></div>
      <div class="field"><span class="label">Participant: </span><span class="val">${escapeHtml(client.name)}</span></div>
      <h2>Enrollment &amp; Discharge Status</h2>
      <table><tr><th>Order</th><th>Enrollment Confirmed</th><th>Discharge / Completion Status</th></tr>
      ${programs.map(p => `<tr><td>${escapeHtml(p.order_name)}</td><td>Yes — since ${escapeHtml(p.start_date) || '—'}</td><td>${escapeHtml(p.status)}${p.completed_at ? ' (' + escapeHtml(p.completed_at.split('T')[0]) + ')' : ''}</td></tr>`).join('') || '<tr><td colspan="3">No court orders on record</td></tr>'}
      </table>
      <h2>Sessions Attended / Missed</h2>
      <div class="field"><span class="label">Attended: </span><span class="val">${records.filter(r => r.attendance_status === 'attended').length}</span> &nbsp; <span class="label">Missed: </span><span class="val">${records.filter(r => r.attendance_status === 'missed').length}</span> &nbsp; <span class="label">Excused: </span><span class="val">${records.filter(r => r.attendance_status === 'excused').length}</span></div>
      <h2>Requirements Completed</h2>
      ${programs.map(p => `<div class="field"><span class="label">${escapeHtml(p.order_name)}: </span><span class="val">${p.total_services_completed ?? '—'} services, ${p.total_units_completed ?? '—'} units</span></div>`).join('') || '<div class="field">—</div>'}
      <h2>Compliance Status</h2>
      <div class="field"><span class="label">Compliant: </span><span class="val">${records.filter(r => r.compliance_status === 'compliant').length}</span> &nbsp; <span class="label">Noncompliant: </span><span class="val">${records.filter(r => r.compliance_status === 'noncompliant').length}</span> &nbsp; <span class="label">Pending Review: </span><span class="val">${records.filter(r => r.compliance_status === 'pending_review').length}</span></div>
      <div class="footer">This report was generated by CourtBridge Solutions to support Florida's problem-solving court reporting requirements (Ch. 2026-139). OSCA has not yet published a final technical reporting format; this is a preparation document, not a certified submission.</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  async function exportPreparationReport() {
    setExporting(true);
    const { data: allClients } = await supabase.from('clients').select('*');
    const { data: allPrograms } = await supabase.from('client_programs').select('*');
    const { data: allRecords } = await supabase.from('service_records').select('*');
    setExporting(false);
    if (!allClients) return;

    // Limited to what a court legitimately needs for compliance reporting: enrollment
    // confirmed, sessions attended/missed, requirements completed, compliance status,
    // and discharge/completion status. No referral, offense, screening, eligibility,
    // employment/housing/custody, or narrative fields -- those stay internal.
    const rows = [[
      'Client Name', 'Order Name', 'Enrollment Confirmed Since', 'Discharge / Completion Status', 'Discharge Date',
      'Sessions Attended', 'Sessions Missed', 'Sessions Excused',
      'Services Completed', 'Units Completed',
      'Compliant Records', 'Noncompliant Records', 'Pending Review Records',
    ]];

    const programsByClient = (allPrograms || []).reduce((acc, p) => { (acc[p.client_id] ||= []).push(p); return acc; }, {});

    for (const c of allClients) {
      const clientPrograms = programsByClient[c.id] || [{}];
      for (const p of clientPrograms) {
        const recs = (allRecords || []).filter(r => (p.id ? r.client_program_id === p.id : r.client_id === c.id));
        rows.push([
          c.name, p.order_name || '', p.start_date || '', p.status || '', p.completed_at ? p.completed_at.split('T')[0] : '',
          recs.filter(r => r.attendance_status === 'attended').length,
          recs.filter(r => r.attendance_status === 'missed').length,
          recs.filter(r => r.attendance_status === 'excused').length,
          p.total_services_completed ?? '', p.total_units_completed ?? '',
          recs.filter(r => r.compliance_status === 'compliant').length,
          recs.filter(r => r.compliance_status === 'noncompliant').length,
          recs.filter(r => r.compliance_status === 'pending_review').length,
        ]);
      }
    }

    downloadCsv(`florida-problem-solving-court-reporting-preparation-export-${new Date().toISOString().split('T')[0]}.csv`, rows);
  }

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: TEXT, margin: 0 }}>Court Reporting</h1>
          <p style={{ color: TEXT_MUTED, fontSize: 13.5, marginTop: 6, maxWidth: 640 }}>
            Documents service, compliance, completion, and outcome data in a consistent format courts can use to support Florida's problem-solving court reporting requirements. Built ahead of the state's 2026 reporting law — OSCA hasn't published its final technical format yet, so this is a preparation record, not a certified submission.
          </p>
        </div>
        <button onClick={exportPreparationReport} disabled={exporting} style={{ padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13.5, whiteSpace: 'nowrap' }}>
          {exporting ? 'Exporting...' : '⬇ Download Preparation Export (CSV)'}
        </button>
      </div>

      <div style={{ ...sectionCard, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <Field label="Client">
              <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          {clientId && client && (
            <button onClick={printComplianceSummary} style={{ padding: '12px 18px', background: 'transparent', border: `0.5px solid ${BORDER}`, color: TEXT, borderRadius: 8, cursor: 'pointer', fontSize: 13.5, marginBottom: 12 }}>
              🖨 Print Compliance Summary
            </button>
          )}
        </div>
      </div>

      {!clientId && <p style={{ color: TEXT_DIM }}>Select a client to view or add outcome and reporting data.</p>}

      {clientId && entryForm && (
        <>
          <div style={sectionCard}>
            <h3 style={{ margin: '0 0 4px', color: TEXT }}>Program Entry</h3>
            <p style={{ margin: '0 0 16px', color: TEXT_DIM, fontSize: 12.5 }}>Snapshot at admission.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 16px' }}>
              <Field label="Referral Source"><input style={inputStyle} value={entryForm.referral_source} onChange={e => setEntryForm({ ...entryForm, referral_source: e.target.value })} /></Field>
              <Field label="Primary Offense (when applicable)"><input style={inputStyle} value={entryForm.primary_offense} onChange={e => setEntryForm({ ...entryForm, primary_offense: e.target.value })} /></Field>
              <Field label="Screening Result"><input style={inputStyle} value={entryForm.screening_result} onChange={e => setEntryForm({ ...entryForm, screening_result: e.target.value })} /></Field>
              <Field label="Eligibility Determination"><input style={inputStyle} value={entryForm.eligibility_determination} onChange={e => setEntryForm({ ...entryForm, eligibility_determination: e.target.value })} /></Field>
              <Field label="Employment Status at Admission"><input style={inputStyle} value={entryForm.employment_status_admission} onChange={e => setEntryForm({ ...entryForm, employment_status_admission: e.target.value })} /></Field>
              <Field label="Housing Status at Admission"><input style={inputStyle} value={entryForm.housing_status_admission} onChange={e => setEntryForm({ ...entryForm, housing_status_admission: e.target.value })} /></Field>
              <Field label="Child-Custody Status at Admission (when applicable)"><input style={inputStyle} value={entryForm.custody_status_admission} onChange={e => setEntryForm({ ...entryForm, custody_status_admission: e.target.value })} /></Field>
            </div>
            {entryError && <div style={{ color: RED, fontSize: 13, marginBottom: 10 }}>{entryError}</div>}
            <button onClick={saveEntry} disabled={savingEntry} style={{ padding: '10px 22px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>{savingEntry ? 'Saving...' : 'Save Entry Info'}</button>
          </div>

          <div style={sectionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ margin: 0, color: TEXT }}>Ongoing Participation</h3>
              <button onClick={() => setShowRecordForm(!showRecordForm)} style={{ padding: '8px 16px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{showRecordForm ? 'Cancel' : '+ Add Entry'}</button>
            </div>
            <p style={{ margin: '0 0 16px', color: TEXT_DIM, fontSize: 12.5 }}>Service and compliance entries. The event and the compliance decision are recorded separately — a missed session isn't automatically noncompliance.</p>

            {showRecordForm && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 18, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                  <Field label="Service / Treatment Type"><input style={inputStyle} value={recordForm.service_type} onChange={e => setRecordForm({ ...recordForm, service_type: e.target.value })} placeholder="e.g. Individual counseling session" /></Field>
                  <Field label="Date of Service"><input type="date" style={inputStyle} value={recordForm.service_date} onChange={e => setRecordForm({ ...recordForm, service_date: e.target.value })} /></Field>
                  <Field label="Units of Service"><input style={inputStyle} value={recordForm.units} onChange={e => setRecordForm({ ...recordForm, units: e.target.value })} placeholder="e.g. 1" /></Field>
                  <Field label="Attendance Status">
                    <select style={inputStyle} value={recordForm.attendance_status} onChange={e => setRecordForm({ ...recordForm, attendance_status: e.target.value })}>
                      <option value="attended">Attended</option><option value="missed">Missed</option><option value="excused">Excused</option><option value="rescheduled">Rescheduled</option>
                    </select>
                  </Field>
                </div>
                <NotesWarning />
                <Field label="What happened (event notes)"><textarea style={{ ...inputStyle, minHeight: 60 }} value={recordForm.event_notes} onChange={e => setRecordForm({ ...recordForm, event_notes: e.target.value })} /></Field>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
                  <Field label="Compliance Decision">
                    <select style={inputStyle} value={recordForm.compliance_status} onChange={e => setRecordForm({ ...recordForm, compliance_status: e.target.value })}>
                      <option value="pending_review">Pending Review</option><option value="compliant">Compliant</option><option value="noncompliant">Noncompliant</option>
                    </select>
                  </Field>
                  <Field label="Reason (if noncompliant)"><input style={inputStyle} value={recordForm.reason_noncompliance} onChange={e => setRecordForm({ ...recordForm, reason_noncompliance: e.target.value })} /></Field>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT, marginBottom: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={recordForm.new_offense_reported} onChange={e => setRecordForm({ ...recordForm, new_offense_reported: e.target.checked })} />
                  New offense reported during this period
                </label>
                {recordForm.new_offense_reported && <Field label="Offense Details"><textarea style={{ ...inputStyle, minHeight: 50 }} value={recordForm.new_offense_details} onChange={e => setRecordForm({ ...recordForm, new_offense_details: e.target.value })} /></Field>}
                <Field label="Supporting Documentation (link, or reference to a file in Documents)"><input style={inputStyle} value={recordForm.documentation_url} onChange={e => setRecordForm({ ...recordForm, documentation_url: e.target.value })} /></Field>
                {recordError && <div style={{ color: RED, fontSize: 13, marginBottom: 10 }}>{recordError}</div>}
                <button onClick={saveRecord} disabled={savingRecord} style={{ padding: '10px 22px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>{savingRecord ? 'Saving...' : 'Save Entry'}</button>
              </div>
            )}

            {records.length === 0 ? <p style={{ color: TEXT_DIM, fontSize: 13 }}>No service records yet.</p> : records.map(r => (
              <div key={r.id} style={{ borderBottom: `0.5px solid ${BORDER}`, padding: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ color: TEXT, fontWeight: 600, fontSize: 14 }}>{r.service_type}</span>
                    <span style={{ color: TEXT_DIM, fontSize: 12.5, marginLeft: 8 }}>{r.service_date}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, color: COMPLIANCE_COLORS[r.compliance_status] || TEXT_MUTED, background: `${COMPLIANCE_COLORS[r.compliance_status] || TEXT_MUTED}22` }}>{(r.compliance_status || '').replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: 12.5, color: TEXT_MUTED, marginTop: 4 }}>{r.attendance_status}{r.units ? ` • ${r.units} unit(s)` : ''}{r.new_offense_reported ? ' • New offense reported' : ''}</div>
                {r.event_notes && <div style={{ fontSize: 12.5, color: TEXT_DIM, marginTop: 3 }}>{r.event_notes}</div>}
              </div>
            ))}
          </div>

          <div style={sectionCard}>
            <h3 style={{ margin: '0 0 4px', color: TEXT }}>Program Exit</h3>
            <p style={{ margin: '0 0 16px', color: TEXT_DIM, fontSize: 12.5 }}>Snapshot for a specific court order.</p>
            {programs.length === 0 ? <p style={{ color: TEXT_DIM, fontSize: 13 }}>This client has no court orders yet — add one from their profile first.</p> : (
              <>
                <Field label="Court Order">
                  <select style={inputStyle} value={exitProgramId} onChange={e => setExitProgramId(e.target.value)}>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.order_name} ({p.status})</option>)}
                  </select>
                </Field>
                {exitForm && <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 16px' }}>
                    <Field label="Court / Program Type">
                      <select style={inputStyle} value={exitForm.court_program_type} onChange={e => setExitForm({ ...exitForm, court_program_type: e.target.value })}>
                        <option value="">Select...</option>
                        <option value="drug_court">Drug Court</option>
                        <option value="mental_health_court">Mental Health Court</option>
                        <option value="veterans_treatment_court">Veterans Treatment Court</option>
                        <option value="early_childhood_court">Early Childhood Court</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Reason for Failure to Complete (if applicable)"><input style={inputStyle} value={exitForm.termination_reason} onChange={e => setExitForm({ ...exitForm, termination_reason: e.target.value })} /></Field>
                    <Field label="Employment Status at Exit"><input style={inputStyle} value={exitForm.employment_status_exit} onChange={e => setExitForm({ ...exitForm, employment_status_exit: e.target.value })} /></Field>
                    <Field label="Housing Status at Exit"><input style={inputStyle} value={exitForm.housing_status_exit} onChange={e => setExitForm({ ...exitForm, housing_status_exit: e.target.value })} /></Field>
                    <Field label="Child-Custody Status at Exit"><input style={inputStyle} value={exitForm.custody_status_exit} onChange={e => setExitForm({ ...exitForm, custody_status_exit: e.target.value })} /></Field>
                    <Field label="Total Services Completed"><input style={inputStyle} value={exitForm.total_services_completed} onChange={e => setExitForm({ ...exitForm, total_services_completed: e.target.value })} /></Field>
                    <Field label="Total Units Completed"><input style={inputStyle} value={exitForm.total_units_completed} onChange={e => setExitForm({ ...exitForm, total_units_completed: e.target.value })} /></Field>
                  </div>
                  {exitError && <div style={{ color: RED, fontSize: 13, marginBottom: 10 }}>{exitError}</div>}
                  <button onClick={saveExit} disabled={savingExit} style={{ padding: '10px 22px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>{savingExit ? 'Saving...' : 'Save Exit Info'}</button>
                </>}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
