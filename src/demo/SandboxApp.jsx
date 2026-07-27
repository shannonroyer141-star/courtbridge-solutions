import { useState } from 'react';
import { DemoProvider, useDemo } from './DemoContext';

const BLUE = '#1B3A6B';
const DARK = '#1E2A3A';
const DARKER = '#2D3748';
const FEEDBACK_EMAIL = 'info@courtbridgesolutions.com';

function Badge({ children }) {
  return (
    <div style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: '#1E2A3A', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
      {children}
    </div>
  );
}

function Shell({ children, dark }) {
  return (
    <div style={{ minHeight: '100vh', background: dark ? DARK : '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: 16 }}>
      <Badge>CourtBridge Sandbox — Demo Only, No Real Data</Badge>
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle }) {
  const { branding } = useDemo();
  return (
    <div style={{ background: branding.accentColor, padding: '32px 32px 24px', textAlign: 'center' }}>
      <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{title}</div>
      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>{subtitle}</div>
    </div>
  );
}

function Button({ children, onClick, style }) {
  const { branding } = useDemo();
  return (
    <button onClick={onClick} style={{ width: '100%', padding: 14, background: branding.accentColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}

function ProviderSignup() {
  const { signUpProvider } = useDemo();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <Shell>
      <Card>
        <CardHeader title="CourtBridge Solutions" subtitle="Provider Sign-Up (Sandbox Demo)" />
        <div style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Your Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" style={inputStyle} />
          </div>
          <Button onClick={() => signUpProvider(name || 'Demo Provider', email || 'demo@example.com')}>
            Get Started — Send Me a Link
          </Button>
          <div style={{ fontSize: 12, color: '#999', marginTop: 14, textAlign: 'center' }}>
            This is a sandbox demo. No real email is sent, no real account is created.
          </div>
        </div>
      </Card>
    </Shell>
  );
}

const ACCENT_PALETTE = [
  { name: 'Navy', value: '#1B3A6B' },
  { name: 'Forest', value: '#1F5C42' },
  { name: 'Teal', value: '#0F6674' },
  { name: 'Burgundy', value: '#7A2048' },
  { name: 'Slate Purple', value: '#4A3F7A' },
  { name: 'Charcoal', value: '#2D3748' },
  { name: 'Rust', value: '#B4530A' },
  { name: 'Indigo', value: '#3730A3' },
];

function BrandingSetup() {
  const { providerInfo, branding, setBranding } = useDemo();
  const [agencyName, setAgencyName] = useState(branding.agencyName || providerInfo.name || 'Your Agency');
  const [color, setColor] = useState(branding.accentColor);

  return (
    <Shell>
      <Card>
        <div style={{ background: color, padding: '32px 32px 24px', textAlign: 'center', transition: 'background 0.15s' }}>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>{agencyName || 'Your Agency'}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>Powered by CourtBridge Solutions</div>
        </div>
        <div style={{ padding: '28px 32px' }}>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            This is what your clients and staff will see. Pick a color and see it applied live — this carries through the rest of the demo.
          </div>
          <label style={labelStyle}>Agency Name</label>
          <input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="Your Agency Name" style={{ ...inputStyle, marginBottom: 20 }} />

          <label style={labelStyle}>Accent Color</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {ACCENT_PALETTE.map(swatch => (
              <button
                key={swatch.value}
                onClick={() => setColor(swatch.value)}
                title={swatch.name}
                style={{
                  height: 44, borderRadius: 8, background: swatch.value, cursor: 'pointer',
                  border: color === swatch.value ? '3px solid #1E2A3A' : '3px solid transparent',
                  outline: color === swatch.value ? '2px solid #fff' : 'none',
                  outlineOffset: -6,
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setBranding(color, agencyName || 'Your Agency')}
            style={{ width: '100%', padding: 14, background: color, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
          >
            Continue with {ACCENT_PALETTE.find(s => s.value === color)?.name || 'this color'} →
          </button>
          <div style={{ fontSize: 12, color: '#999', marginTop: 14, textAlign: 'center' }}>
            Full branding (logo, more colors) is available on select plans. This sandbox shows a limited preview.
          </div>
        </div>
      </Card>
    </Shell>
  );
}

function ProviderDashboardDemo() {
  const { providerInfo, sendClientLink, clientInfo, phase, checkins, switchToClient, viewCourtReport, complianceSummary } = useDemo();
  const isUpdated = phase === 'provider-dashboard-updated';

  return (
    <Shell>
      <Card>
        <CardHeader title={`Welcome, ${providerInfo.name}`} subtitle="Provider Dashboard (Sandbox Demo)" />
        <div style={{ padding: '28px 32px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Your Clients
          </div>
          <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{clientInfo.name}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{clientInfo.population_type.replace('_', ' ')}</div>
            {isUpdated ? (
              <div style={{ marginTop: 10, fontSize: 13 }}>
                <div style={{ color: '#16A34A', fontWeight: 700 }}>● Active — Reporting</div>
                <div style={{ color: '#555', marginTop: 4 }}>{checkins.length} check-ins logged · {complianceSummary.compliance_rate}% compliance</div>
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 13, color: '#D97706', fontWeight: 700 }}>● Pending — Link Sent</div>
            )}
          </div>

          {!isUpdated && phase === 'provider-dashboard' && (
            <Button onClick={sendClientLink}>Send Enrollment Link to {clientInfo.name}</Button>
          )}

          {phase === 'client-link-sent' && (
            <div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 14, fontSize: 13, color: '#1E40AF', marginBottom: 16 }}>
                ✓ Link sent to {clientInfo.name}. In real use, they'd get this by text or email.
              </div>
              <Button onClick={switchToClient} style={{ background: '#374151' }}>
                Switch to Client View →
              </Button>
            </div>
          )}

          {isUpdated && (
            <Button onClick={viewCourtReport}>View Compliance Report</Button>
          )}
        </div>
      </Card>
    </Shell>
  );
}

function ClientOnboardingDemo() {
  const { clientInfo, completeOnboarding } = useDemo();
  const [step, setStep] = useState(1);

  return (
    <Shell dark>
      <Card>
        <CardHeader title={`Welcome, ${clientInfo.name}`} subtitle={`Step ${step} of 3 — Enrollment`} />
        <div style={{ padding: '28px 32px' }}>
          {step === 1 && (
            <>
              <div style={{ fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 1.6 }}>
                You've been enrolled in a compliance program through your provider. This app will track your check-ins with GPS verification.
              </div>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </>
          )}
          {step === 2 && (
            <>
              <div style={{ fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 1.6 }}>
                We need permission to use your location only at the moment you check in — never tracked in the background.
              </div>
              <Button onClick={() => setStep(3)}>Allow &amp; Continue</Button>
            </>
          )}
          {step === 3 && (
            <>
              <div style={{ fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 1.6 }}>
                By continuing, you agree to check in as scheduled. Your provider will see your compliance record.
              </div>
              <Button onClick={completeOnboarding}>I Agree — Complete Enrollment</Button>
            </>
          )}
        </div>
      </Card>
    </Shell>
  );
}

function ClientDashboardDemo() {
  const { clientInfo, checkins, doCheckIn, switchToProvider } = useDemo();
  const doneToday = checkins.some(c => c.day_offset === 0);

  return (
    <Shell dark>
      <Card>
        <div style={{ background: DARKER, padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Good morning, {clientInfo.name.split(' ')[0]}</div>
          <div style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Day {checkins.length} of your program</div>
        </div>
        <div style={{ padding: '28px 32px', background: DARK }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {checkins.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#CBD5E0', padding: '6px 0', borderBottom: '1px solid #374151' }}>
                <span>{c.status === 'completed' ? '✓ Checked in' : '✗ Missed'}</span>
                <span>{c.time || '—'}</span>
              </div>
            ))}
          </div>

          {!doneToday ? (
            <Button onClick={doCheckIn} style={{ background: '#16A34A', padding: 18, fontSize: 16 }}>
              📍 Check In Now (GPS)
            </Button>
          ) : (
            <>
              <div style={{ background: '#14532D', color: '#86EFAC', borderRadius: 8, padding: 14, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                ✓ You're checked in for today
              </div>
              <Button onClick={switchToProvider} style={{ background: '#374151' }}>
                Switch back to Provider View →
              </Button>
            </>
          )}
        </div>
      </Card>
    </Shell>
  );
}

function CourtReportDemo() {
  const { clientInfo, checkins, complianceSummary, providerInfo } = useDemo();
  const completed = checkins.filter(c => c.status === 'completed').length;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 29);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const periodLabel = `${fmt(startDate)} – ${fmt(today)}`;

  function handleDownload() {
    alert('In the live platform, this generates a signed PDF report ready to send to the court or referring agency. (Sandbox demo — no file generated.)');
  }

  return (
    <Shell>
      <Card>
        <CardHeader title="Compliance Report" subtitle="Read-Only — Ready for Court, PO, or Referring Agency" />
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Client</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{clientInfo.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Provider</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{providerInfo.name || 'Demo Recovery Partners'}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#888', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
            Reporting Period: {periodLabel}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 8, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#16A34A' }}>{completed}</div>
              <div style={{ fontSize: 11, color: '#666' }}>Completed</div>
            </div>
            <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 8, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626' }}>{checkins.length - completed}</div>
              <div style={{ fontSize: 11, color: '#666' }}>Missed</div>
            </div>
            <div style={{ flex: 1, background: '#EFF6FF', borderRadius: 8, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1E40AF' }}>{complianceSummary.compliance_rate}%</div>
              <div style={{ fontSize: 11, color: '#666' }}>Compliance</div>
            </div>
          </div>

          <Button onClick={handleDownload} style={{ background: '#374151', marginBottom: 16 }}>
            ⬇ Download PDF Report
          </Button>

          <div style={{ fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 1.6 }}>
            This is the infrastructure that's been missing — verified, connected, accountable.
          </div>
        </div>
      </Card>
    </Shell>
  );
}

function SandboxRouter() {
  const { phase } = useDemo();
  if (phase === 'provider-signup') return <ProviderSignup />;
  if (phase === 'customize-branding') return <BrandingSetup />;
  if (phase === 'provider-dashboard' || phase === 'client-link-sent' || phase === 'provider-dashboard-updated') return <ProviderDashboardDemo />;
  if (phase === 'client-onboarding') return <ClientOnboardingDemo />;
  if (phase === 'client-dashboard') return <ClientDashboardDemo />;
  if (phase === 'court-report') return <CourtReportDemo />;
  return <ProviderSignup />;
}

function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  function handleSend() {
    const subject = encodeURIComponent('CourtBridge Sandbox Feedback');
    const body = encodeURIComponent(`Rating: ${rating}/5\n\n${text || '(no message entered)'}`);
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 200,
          background: BLUE, color: '#fff', border: 'none', borderRadius: 30,
          padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        💬 Give Feedback
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 200,
      background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      width: 300, padding: 18,
    }}>
      {!sent ? (
        <>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: '#1B3A6B' }}>
            Rate your experience
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                onClick={() => setRating(n)}
                style={{ fontSize: 26, cursor: 'pointer', color: n <= rating ? '#F59E0B' : '#ddd' }}
              >
                ★
              </span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>
            How would this fit into your current caseload, and what would you change to make it fit your everyday needs?
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type your thoughts here..."
            style={{ width: '100%', height: 90, padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', resize: 'none', marginBottom: 10, fontFamily: 'Arial, sans-serif' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setOpen(false)} style={{ flex: 1, padding: 10, background: '#f1f1f1', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSend} style={{ flex: 1, padding: 10, background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Send
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#16A34A' }}>
            Thank you!
          </div>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>
            Your email app should have opened with your feedback ready to send. If it didn't, email us directly at {FEEDBACK_EMAIL}.
          </div>
          <button onClick={() => { setOpen(false); setSent(false); setText(''); setRating(0); }} style={{ width: '100%', padding: 10, background: '#f1f1f1', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            Close
          </button>
        </>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };
const inputStyle = { width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none' };

export default function SandboxApp() {
  return (
    <DemoProvider>
      <SandboxRouter />
      <FeedbackWidget />
    </DemoProvider>
  );
}