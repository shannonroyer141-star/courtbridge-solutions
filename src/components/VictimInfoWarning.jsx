import { useState } from 'react';
import { supabase } from '../supabase';
import { RED, TEXT, TEXT_MUTED, NAV_FONT } from '../theme';

// lightBg: pass true when this renders on a light/cream surface (e.g. the Calendar's
// Classic style) so the text stays readable instead of the near-white default every
// other (dark-themed) screen in the app relies on.
// Kept deliberately quiet -- a thin colored accent line instead of a filled/bordered
// box, smaller text -- the warning still has to stay, just not shout.
const warningBox = (lightBg) => ({
  background: 'transparent',
  borderLeft: `2px solid ${RED}`,
  borderRadius: 0,
  padding: '3px 10px',
  marginBottom: 8,
  fontSize: 11,
  color: lightBg ? 'rgba(58,46,34,0.6)' : TEXT_MUTED,
  lineHeight: 1.4,
  fontFamily: NAV_FONT,
});

// Shown above every free-text field where participant notes or compliance information can be entered.
export function NotesWarning({ lightBg = false } = {}) {
  return (
    <div style={warningBox(lightBg)}>
      <strong>Do not enter victim information.</strong> Use this field only for information about the program participant. Do not include victim names, contact information, addresses, locations, identifying details, safety information, or information about a victim's children or household members.
    </div>
  );
}

// Shown above every document upload control.
export function UploadWarning({ lightBg = false } = {}) {
  return (
    <div style={warningBox(lightBg)}>
      <strong>Do not upload victim information.</strong> CourtBridge does not collect or maintain victim names, contact information, addresses, locations, safety plans, identifying details, or documents containing victim information. All documents must be properly redacted before upload.
    </div>
  );
}

// Required confirmation checkbox gating any document upload. Caller owns the checked state
// and must block the actual upload call until checked, then record who/when confirmed.
export function UploadConfirmCheckbox({ checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: TEXT, lineHeight: 1.5, marginBottom: 12, cursor: 'pointer', fontFamily: NAV_FONT }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
      <span>I confirm that this document has been reviewed and does not contain victim-identifying information, victim contact information, protected locations, safety information, or information identifying a victim's children or household members.</span>
    </label>
  );
}

// Section 6: lets whoever can currently see a record flag it as suspected victim
// information. Sets restricted = true on the source row (RLS then hides it from
// ordinary users immediately) and logs the flag for an authorized privacy admin to review.
export function FlagRestrictedButton({ tableName, recordId, clientId, onFlagged }) {
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);

  async function handleFlag() {
    const reason = window.prompt('Briefly describe why this record may contain victim information (optional):') || null;
    if (reason === null && !window.confirm('Flag this record as restricted without a reason?')) return;
    setFlagging(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('victim_info_flags').insert([{ table_name: tableName, record_id: recordId, client_id: clientId || null, flagged_by: user.id, reason }]);
    const { error } = await supabase.from(tableName).update({ restricted: true }).eq('id', recordId);
    setFlagging(false);
    if (!error) { setFlagged(true); onFlagged?.(); }
  }

  if (flagged) return <span style={{ fontSize: 11, color: RED, fontFamily: NAV_FONT }}>Restricted — pending review</span>;

  return (
    <button onClick={handleFlag} disabled={flagging} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 11, cursor: 'pointer', fontFamily: NAV_FONT, padding: 0, textDecoration: 'underline' }}>
      {flagging ? 'Flagging...' : '🚩 Flag as possible victim information'}
    </button>
  );
}
