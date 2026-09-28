import { useState, useEffect } from 'react';
import writeExcelFile from 'write-excel-file/universal';
import { supabase } from '../supabase';
import { GREEN, WARNING, TEXT_MUTED, TEXT_DIM, ACCENT } from '../theme';
import { missingStaffItems, participantFileChecks } from '../lib/bipRules';
import { Field, Row2, Col, ErrorBox } from './bipShared';
import {
  inputStyle, sectionCard, btn, ghostBtn, rowStyle, pageStyle, escapeHtml, fmtDate, today, printHtml, dcfStatus, BIP_SESSION_TYPE,
} from '../lib/bipUi';

// DCF monitoring packet -- builds the documents DCF's "BIP Request for Documents" asks for
// (Florida DCF Office of Domestic Violence), in DCF's own format:
//   #5 Employees Roster: #, Employee Name, Position Title, Date of Hire, Date of Termination
//   #6 Participants Roster: #, Participant Name, File Number, Status, County of Residence
//   (file numbers in red text; one participant roster per location)
// plus a file-by-file readiness check against DCF's Personnel and Participant File Review tools.

const DCF_FORMS = [
  ['BIP Policy Checklist (Excel)', 'https://www.myflfamilies.com/documents/59276.xlsx'],
  ['BIP Curriculum Checklist (Excel)', 'https://www.myflfamilies.com/documents/59271.xlsx'],
  ['BIP Request for Documents (Excel)', 'https://www.myflfamilies.com/documents/59281.xlsx'],
  ['BIP Monitoring Review Tools (Excel)', 'https://www.myflfamilies.com/documents/59266.xlsx'],
  ['Rule 65H-2, F.A.C. (PDF)', 'https://www.myflfamilies.com/documents/661.pdf'],
];

const POSITION_TITLES = { facilitator: 'BIP Group Facilitator', assessor: 'BIP Assessor', trainer: 'Trainer', admin: 'Administrative', clinical_supervisor: 'Clinical Supervisor', other: 'Other' };

function yearAgo() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
}

function longDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function downloadXlsx(sheetData, columns, fileName) {
  const blob = await writeExcelFile(sheetData, { columns }).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DcfReviewPacket() {
  const [start, setStart] = useState(yearAgo());
  const [end, setEnd] = useState(today());
  const [staff, setStaff] = useState([]);
  const [participants, setParticipants] = useState([]); // [{ client, intake, discharge, checks }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    const [{ data: st, error: e1 }, { data: cs, error: e2 }] = await Promise.all([
      supabase.from('staff_personnel').select('*').order('full_name'),
      supabase.from('clients').select('id, name, enrollment_date').eq('population_type', 'bip').order('name'),
    ]);
    if (e1 || e2) { setError((e1 || e2).message); setLoading(false); return; }
    const ids = (cs || []).map(c => c.id);
    let intakes = [], discharges = [], notices = [], sessions = [], fees = [], violations = [];
    if (ids.length) {
      const results = await Promise.all([
        supabase.from('bip_intake').select('*').in('client_id', ids),
        supabase.from('bip_discharges').select('*').in('client_id', ids).order('discharge_at', { ascending: false }),
        supabase.from('victim_notifications').select('*').in('client_id', ids),
        supabase.from('service_records').select('id, client_id, attendance_status').in('client_id', ids).eq('service_type', BIP_SESSION_TYPE),
        supabase.from('bip_fee_payments').select('id, client_id').in('client_id', ids),
        supabase.from('violation_reports').select('id, client_id, status, submitted_to, restricted').in('client_id', ids),
      ]);
      [intakes, discharges, notices, sessions, fees, violations] = results.map(r => r.data || []);
    }
    const by = (rows, id) => rows.filter(r => r.client_id === id);
    setStaff(st || []);
    setParticipants((cs || []).map(c => {
      const intake = intakes.find(i => i.client_id === c.id) || null;
      const discharge = by(discharges, c.id)[0] || null;
      return {
        client: c, intake, discharge,
        checks: participantFileChecks({ intake, notices: by(notices, c.id), discharge, sessions: by(sessions, c.id), fees: by(fees, c.id), violations: by(violations, c.id) }),
      };
    }));
    setLoading(false);
  }

  // Employees on staff at any point in the period: hired on/before the end, and not separated before the start.
  const staffInPeriod = staff.filter(s => (!s.hire_date || s.hire_date <= end) && (!s.separation_date || s.separation_date >= start));
  // Participants in the program at any point in the period.
  const participantsInPeriod = participants.filter(p =>
    (!p.client.enrollment_date || p.client.enrollment_date <= end) &&
    (!p.discharge || p.discharge.discharge_at.slice(0, 10) >= start));

  const title = (text, width) => [{ value: text, fontWeight: 'bold', fontSize: 14, columnSpan: width }, ...Array(width - 1).fill(null)];
  const range = width => [{ value: `${longDate(start)} - ${longDate(end)}`, columnSpan: width }, ...Array(width - 1).fill(null)];
  const head = labels => labels.map(l => ({ value: l, fontWeight: 'bold', backgroundColor: '#E7E6E6', borderStyle: 'thin' }));
  const num = n => ({ value: n, type: Number, textColor: '#FF0000', fontWeight: 'bold', borderStyle: 'thin' });
  const cell = v => ({ value: v ?? '', type: String, borderStyle: 'thin' });

  async function exportEmployees() {
    try {
      const data = [
        title('Employees Roster', 5), range(5), [],
        head(['#', 'Employee Name', 'Position Title', 'Date of Hire', 'Date of Termination']),
        ...staffInPeriod.map((s, i) => [num(i + 1), cell(s.full_name), cell(POSITION_TITLES[s.role_title] || s.role_title || ''), cell(fmtDate(s.hire_date)), cell(s.separation_date ? fmtDate(s.separation_date) : 'N/A')]),
      ];
      await downloadXlsx(data, [{ width: 6 }, { width: 30 }, { width: 30 }, { width: 16 }, { width: 20 }], `Employees-Roster-${start}-to-${end}.xlsx`);
    } catch (e) { setError('Could not create the Excel file: ' + e.message); }
  }

  async function exportParticipants() {
    try {
      const data = [
        title('Participants Roster', 5), range(5), [],
        head(['#', 'Participant Name', 'File Number', 'Status', 'County of Residence']),
        ...participantsInPeriod.map((p, i) => [num(i + 1), cell(p.client.name), cell(p.intake?.file_number || ''), cell(dcfStatus(p.discharge)), cell(p.intake?.county_of_residence || '')]),
      ];
      await downloadXlsx(data, [{ width: 6 }, { width: 30 }, { width: 16 }, { width: 38 }, { width: 22 }], `Participants-Roster-${start}-to-${end}.xlsx`);
    } catch (e) { setError('Could not create the Excel file: ' + e.message); }
  }

  const bipStaff = staffInPeriod.filter(s => (s.role_title === 'facilitator' || s.role_title === 'assessor') && s.employment_status === 'active');
  const staffIssues = bipStaff.map(s => ({ s, missing: missingStaffItems(s) })).filter(x => x.missing.length);
  const participantIssues = participantsInPeriod.map(p => ({ p, failing: p.checks.filter(c => c.ok === false) })).filter(x => x.failing.length);

  function printReadiness() {
    printHtml('DCF Monitoring Readiness', `
      <h1>DCF Monitoring Readiness</h1>
      <div class="field"><span class="label">Review period: </span>${escapeHtml(longDate(start))} - ${escapeHtml(longDate(end))}</div>
      <h2>Personnel files (${bipStaff.length} active facilitators/assessors, ${staffIssues.length} with gaps)</h2>
      ${staffIssues.length === 0 ? '<div class="field">No gaps found.</div>' : `<table><tr><th>Employee</th><th>Missing</th></tr>
        ${staffIssues.map(({ s, missing }) => `<tr><td>${escapeHtml(s.full_name)}</td><td>${missing.map(escapeHtml).join('<br>')}</td></tr>`).join('')}</table>`}
      <h2>Participant files (${participantsInPeriod.length} in period, ${participantIssues.length} with gaps)</h2>
      ${participantIssues.length === 0 ? '<div class="field">No gaps found.</div>' : `<table><tr><th>Participant</th><th>File #</th><th>Missing</th></tr>
        ${participantIssues.map(({ p, failing }) => `<tr><td>${escapeHtml(p.client.name)}</td><td>${escapeHtml(p.intake?.file_number || '')}</td><td>${failing.map(c => escapeHtml(c.item)).join('<br>')}</td></tr>`).join('')}</table>`}
      <div class="note">Checks follow DCF's BIP Monitoring Review Tools (Personnel File Review and Participant File Review) and Rule 65H-2, F.A.C. Victim contact information is never included.</div>
    `);
  }

  return (
    <div style={pageStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>DCF Review Packet</h2>
      <div style={{ color: TEXT_MUTED, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
        Builds the rosters DCF asks for in its BIP Request for Documents, in DCF's format, and checks every file against DCF's monitoring checklists before the review. DCF wants documents emailed to <strong>BIPCertification@myflfamilies.com</strong>, each item as a separate file.
      </div>
      <ErrorBox error={error} />

      <div style={sectionCard}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Review period</div>
        <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 10 }}>Use the dates from DCF's request (usually your most recent certification date through the date DCF gives).</div>
        <Row2>
          <Col min={180}><Field label="From"><input type="date" style={inputStyle} value={start} onChange={e => setStart(e.target.value)} /></Field></Col>
          <Col min={180}><Field label="Through"><input type="date" style={inputStyle} value={end} onChange={e => setEnd(e.target.value)} /></Field></Col>
        </Row2>
      </div>

      <div style={sectionCard}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Rosters (Excel)</div>
        {loading ? <div style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading...</div> : <>
          <div style={rowStyle}>
            <span>#5 Employees Roster · {staffInPeriod.length} employee{staffInPeriod.length === 1 ? '' : 's'}</span>
            <button style={btn()} onClick={exportEmployees}>Download</button>
          </div>
          <div style={rowStyle}>
            <span>#6 Participants Roster · {participantsInPeriod.length} participant{participantsInPeriod.length === 1 ? '' : 's'}</span>
            <button style={btn()} onClick={exportParticipants}>Download</button>
          </div>
          <div style={{ fontSize: 12.5, color: TEXT_DIM, marginTop: 10, lineHeight: 1.5 }}>
            Files are numbered in red, as DCF asks. If you have more than one program location, DCF wants a separate participant roster for each location; split the downloaded file by location before sending.
            {participantsInPeriod.some(p => !p.intake?.file_number || !p.intake?.county_of_residence) && <span style={{ color: WARNING }}> Some participants are missing a file number or county; add them on the BIP Participant File screen.</span>}
          </div>
        </>}
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700 }}>File readiness</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={ghostBtn} onClick={load}>Refresh</button>
            <button style={ghostBtn} onClick={printReadiness}>Print readiness report</button>
          </div>
        </div>
        <div style={{ fontSize: 13.5, marginBottom: 6 }}>
          Personnel files: {staffIssues.length === 0 ? <span style={{ color: GREEN }}>all {bipStaff.length} complete</span> : <span style={{ color: WARNING }}>{staffIssues.length} of {bipStaff.length} with gaps</span>}
        </div>
        {staffIssues.map(({ s, missing }) => <div key={s.id} style={{ fontSize: 12.5, color: TEXT_MUTED, padding: '2px 0 2px 12px' }}>{s.full_name}: {missing.join(' · ')}</div>)}
        <div style={{ fontSize: 13.5, margin: '12px 0 6px' }}>
          Participant files: {participantIssues.length === 0 ? <span style={{ color: GREEN }}>all {participantsInPeriod.length} complete</span> : <span style={{ color: WARNING }}>{participantIssues.length} of {participantsInPeriod.length} with gaps</span>}
        </div>
        {participantIssues.map(({ p, failing }) => <div key={p.client.id} style={{ fontSize: 12.5, color: TEXT_MUTED, padding: '2px 0 2px 12px' }}>{p.client.name}: {failing.length} missing ({failing.slice(0, 3).map(c => c.item).join(' · ')}{failing.length > 3 ? ' ...' : ''})</div>)}
      </div>

      <div style={sectionCard}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Also in DCF's request</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>
          <div>#1 BIP Policy Checklist, completed, plus any policies changed since last certification</div>
          <div>#2 BIP Curriculum Checklist, completed, plus any new or updated curriculum material</div>
          <div>#3 Photo of the DCF certificate displayed in public view at every program location</div>
          <div>#4 Interview Schedule form (interviews are on Microsoft Teams, camera and audio on)</div>
          <div>Desk review: personnel files and participant files for the people DCF picks</div>
        </div>
        <div style={{ fontWeight: 600, margin: '14px 0 6px', fontSize: 13 }}>DCF forms</div>
        {DCF_FORMS.map(([label, url]) => <div key={url} style={{ fontSize: 13, padding: '2px 0' }}><a href={url} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>{label}</a></div>)}
      </div>
    </div>
  );
}
