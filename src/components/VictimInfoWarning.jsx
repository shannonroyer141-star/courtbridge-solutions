import { RED, TEXT, NAV_FONT } from '../theme';

const warningBox = {
  background: 'rgba(248,113,113,0.1)',
  border: `0.5px solid ${RED}`,
  borderRadius: 8,
  padding: '10px 14px',
  marginBottom: 10,
  fontSize: 12.5,
  color: TEXT,
  lineHeight: 1.5,
  fontFamily: NAV_FONT,
};

// Shown above every free-text field where participant notes or compliance information can be entered.
export function NotesWarning() {
  return (
    <div style={warningBox}>
      <strong>Do not enter victim information.</strong> Use this field only for information about the program participant. Do not include victim names, contact information, addresses, locations, identifying details, safety information, or information about a victim's children or household members.
    </div>
  );
}

// Shown above every document upload control.
export function UploadWarning() {
  return (
    <div style={warningBox}>
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
