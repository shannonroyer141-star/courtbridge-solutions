import { DARK_BG, CARD_BG, ACCENT, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme'

export default function SignupSuccess() {
  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: NAV_FONT }}>
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 10 }}>You're all set!</div>
        <div style={{ fontSize: 15, color: TEXT_MUTED, marginBottom: 24, lineHeight: 1.6 }}>
          Payment received. Check your email for an invite link to set your password and log in to CourtBridge.
        </div>
        <div style={{ background: 'rgba(91,155,240,0.12)', borderRadius: 10, padding: 16, fontSize: 13, color: ACCENT, lineHeight: 1.6 }}>
          Didn't get the email within a few minutes? Check spam, or reach out to us and we'll help you get set up.
        </div>
      </div>
    </div>
  )
}
