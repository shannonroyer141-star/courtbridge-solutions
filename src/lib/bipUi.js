// Shared styles and helpers for the BIP compliance screens (Florida Rule 65H-2, F.A.C.).
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme';

export const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14, width: '100%' };
export const labelStyle = { fontSize: 12, color: TEXT_MUTED, marginBottom: 4, display: 'block' };
export const sectionCard = { background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 20 };
export const optStyle = { background: '#1E2A3A', color: '#fff' };
export const btn = (bg = ACCENT) => ({ background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: NAV_FONT });
export const ghostBtn = { background: 'none', border: `0.5px solid ${BORDER}`, color: TEXT, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', fontFamily: NAV_FONT };
export const rowStyle = { padding: '10px 0', borderBottom: `0.5px solid ${BORDER}`, fontSize: 13.5, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' };
export const pageStyle = { padding: 32, fontFamily: NAV_FONT, color: TEXT, maxWidth: 980 };

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function fmt(iso) {
  return iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = dateStr.length === 10 ? new Date(`${dateStr}T12:00:00`) : new Date(dateStr);
  return d.toLocaleDateString();
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Mirrors business_days_due() in the database: end of day N business days after the event
// (weekends skipped; holidays are not, because Rule 65H-2 doesn't define them).
export function businessDaysDue(fromDate, days) {
  const d = new Date(fromDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  d.setHours(23, 59, 59, 0);
  return d;
}

// Status for any deadline + completion pair.
export function deadlineStatus(dueIso, doneIso) {
  const due = new Date(dueIso);
  if (doneIso) {
    return new Date(doneIso) <= due ? { label: 'Done on time', color: GREEN } : { label: 'Done late', color: RED };
  }
  const hoursLeft = (due - Date.now()) / 3600000;
  if (hoursLeft < 0) return { label: 'Overdue', color: RED };
  if (hoursLeft < 24) return { label: 'Due within 24 hours', color: WARNING };
  return { label: 'Pending', color: TEXT_MUTED };
}

export function printHtml(title, bodyHtml) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${escapeHtml(title)}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:760px;margin:0 auto;color:#222;}h1{color:#1B3A6B;border-bottom:3px solid #1B3A6B;padding-bottom:12px;font-size:20px;}h2{color:#1B3A6B;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;margin-top:22px;}.field{margin-bottom:8px;font-size:14px;}.label{font-weight:bold;color:#555;}table{width:100%;border-collapse:collapse;margin-top:10px;}th,td{border:1px solid #ddd;padding:7px 9px;font-size:12.5px;text-align:left;vertical-align:top;}th{background:#f2f2f2;}.note{background:#eef4fb;border-left:4px solid #1B3A6B;padding:10px 14px;font-size:12px;margin:18px 0;}.footer{font-size:11px;color:#888;margin-top:30px;}.sig{margin-top:40px;font-size:13px;}</style>
    </head><body>${bodyHtml}
    <div class="footer">Generated ${escapeHtml(new Date().toLocaleString())} from CourtBridge Solutions.</div>
    </body></html>`);
  win.document.close();
  win.print();
}

export const DISCHARGE_LABELS = { completion: 'Completion', termination: 'Termination', transfer: 'Transfer' };

// DCF roster status wording (BIP Request for Documents, participant roster example).
export function dcfStatus(discharge) {
  if (!discharge) return 'Enrolled - Still attending';
  return discharge.category === 'completion' ? 'Discharged - Completion' : 'Discharged - Non Compliance or Transfer';
}

// Group session attendance records are stored in service_records with this service_type.
export const BIP_SESSION_TYPE = 'BIP group session';
export const BIP_MIN_SESSIONS = 24;   // 65H-2.016(6)(b)
export const BIP_MIN_WEEKS = 29;      // 65H-2.016(6)(b)
