import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ClientAppDashboard from './screens/ClientAppDashboard';
import CheckIn from './screens/CheckIn';
import Clients from './screens/Clients';
import Alerts from './screens/Alerts';
import Reports from './screens/Reports';
import Calendar from './screens/Calendar';
import Tasks from './screens/Tasks';
import DrugTests from './screens/DrugTests';
import ContactLog from './screens/ContactLog';
import Programs from './screens/Programs';
import MeetingLog from './screens/MeetingLog';
import POVisits from './screens/POVisits';
import CourtDates from './screens/CourtDates';
import CPSTracking from './screens/CPSTracking';
import Affirmations from './screens/Affirmations';
import Settings from './screens/Settings';
import ComplianceChart from './screens/ComplianceChart';
import MapView from './screens/MapView';
import ClientProfile from './screens/ClientProfile';
import OrgAdmin from './screens/OrgAdmin';
import Policies from './screens/Policies';
import NonCompete from './screens/NonCompete';
import Legal from './screens/Legal';
import ProviderGuide from './screens/ProviderGuide';
import SOP from './screens/SOP';
import Messages from './screens/Messages';
import ClientInvite from './screens/ClientInvite';
import DocumentUpload from './screens/DocumentUpload';
import ViolationReport from './screens/ViolationReport';
import CompletionCertificate from './screens/CompletionCertificate';
import SMSAlerts from './screens/SMSAlerts';

function NavFolder({ icon, label, items, screen, setScreen, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const isActive = items.some(i => i.id === screen);
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: isActive ? 'rgba(255,255,255,0.1)' : 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>{icon}</span>{label}</span>
        <span style={{ fontSize: '10px', opacity: 0.6 }}>{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div style={{ paddingLeft: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '24px' }}>
          {items.map(item => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: screen === item.id ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: screen === item.id ? 'white' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px' }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceholderScreen({ title, description }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#666' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
      <h2 style={{ color: '#1B3A6B', marginBottom: '8px' }}>{title}</h2>
      <p style={{ fontSize: '14px', color: '#999' }}>{description || 'This feature is being built. Check back soon.'}</p>
    </div>
  );
}

function SuggestionsScreen() {
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#1B3A6B' }}>Sensitive Records — Coming in Phase 3</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>This section will house sensitive client information. We want to build it right — tell us what you need.</p>
      {submitted ? (
        <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '8px', color: '#2e7d32' }}>Thank you! Your suggestion has been noted.</div>
      ) : (
        <div>
          <textarea placeholder="What would you like to see in Sensitive Records?" value={suggestion} onChange={e => setSuggestion(e.target.value)}
            style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }} />
          <button onClick={() => suggestion.trim() && setSubmitted(true)}
            style={{ padding: '12px 24px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            Submit Suggestion
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
  }, []);

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('Invalid email or password.');
    else { const { data: { session } } = await supabase.auth.getSession(); setUser(session?.user ?? null); }
  }

  async function handleSignUp() {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); return; }
    if (data?.user) {
      await supabase.from('profiles').upsert([{ id: data.user.id, email, role: 'provider', onboarding_complete: false }]);
      setError('Account created! Please log in.');
      setAuthMode('login');
    }
  }

  async function handleLogout() { await supabase.auth.signOut(); setUser(null); }

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f9' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', width: '380px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1B3A6B', fontSize: '24px', margin: 0 }}>CourtBridge Solutions</h1>
          <p style={{ color: '#666', margin: '6px 0 0', fontSize: '13px' }}>Turning participation into proof</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button onClick={() => setAuthMode('login')} style={{ flex: 1, padding: '10px', background: authMode === 'login' ? '#1B3A6B' : 'white', color: authMode === 'login' ? 'white' : '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Log In</button>
          <button onClick={() => setAuthMode('signup')} style={{ flex: 1, padding: '10px', background: authMode === 'signup' ? '#1B3A6B' : 'white', color: authMode === 'signup' ? 'white' : '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Sign Up</button>
        </div>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '16px' }} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignUp())} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '16px' }} />
        {error && <p style={{ color: error.includes('created') ? '#27AE60' : '#E74C3C', textAlign: 'center', marginBottom: '12px', fontSize: '14px' }}>{error}</p>}
        <button onClick={authMode === 'login' ? handleLogin : handleSignUp} style={{ width: '100%', padding: '13px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
          {authMode === 'login' ? 'Log In' : 'Create Account'}
        </button>
      </div>
    </div>
  );

  function renderScreen() {
    if (screen === 'profile' && selectedClientId) return <ClientProfile clientId={selectedClientId} onBack={() => setScreen('clients')} />;
    switch (screen) {
      case 'alerts': return <Alerts />;
      case 'calendar': return <Calendar />;
      case 'dashboard': return <ClientAppDashboard />;
      case 'checkin': return <CheckIn />;
      case 'clients': return <Clients onSelectClient={id => { setSelectedClientId(id); setScreen('profile'); }} />;
      case 'messages': return <Messages />;
      case 'contactlog': return <ContactLog />;
      case 'documents': return <DocumentUpload />;
      case 'reports': return <Reports />;
      case 'violations': return <ViolationReport />;
      case 'chart': return <ComplianceChart />;
      case 'map': return <MapView />;
      case 'tasks': return <Tasks />;
      case 'programs': return <Programs />;
      case 'sms': return <SMSAlerts />;
      case 'sop': return <SOP />;
      case 'providerguide': return <ProviderGuide />;
      case 'orgadmin': return <OrgAdmin />;
      case 'invite': return <ClientInvite />;
      case 'certificates': return <CompletionCertificate />;
      case 'legal': return <Legal />;
      case 'policies': return <Policies />;
      case 'settings': return <Settings />;
      case 'affirmations': return <Affirmations />;
      case 'sensitive': return <SuggestionsScreen />;
      case 'assessments': return <PlaceholderScreen title="Assessments" description="Phase 2 feature — standardized assessment tools coming soon." />;
      case 'granttracking': return <PlaceholderScreen title="Grant Tracking" description="Phase 3 feature — grant planning and tracking coming soon." />;
      case 'auditreadiness': return <PlaceholderScreen title="Audit Readiness" description="Phase 3 feature — audit readiness scoring coming soon." />;
      case 'orgSettings': return <PlaceholderScreen title="Org Settings" description="Configure your organization details." />;
      case 'usermanagement': return <PlaceholderScreen title="User Management" description="Add and manage staff members." />;
      case 'paymentplans': return <PlaceholderScreen title="Payment Plans" description="Manage billing and payment plans." />;
      case 'billinghistory': return <PlaceholderScreen title="Billing History" description="View invoices and payment records." />;
      case 'checkinfreq': return <Settings />;
      case 'alertprefs': return <PlaceholderScreen title="Alert Preferences" description="Configure when and how you receive alerts." />;
      case 'notifemail': return <PlaceholderScreen title="Notification Email" description="Set where missed check-in alerts are sent." />;
      case 'programhours': return <PlaceholderScreen title="Program Hours" description="Set operating hours for GPS validation." />;
      case 'account': return <PlaceholderScreen title="Account" description="Manage your password and profile." />;
      default: return <ClientAppDashboard />;
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <nav style={{ background: '#1B3A6B', width: '220px', padding: '0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>CourtBridge Solutions</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '3px' }}>Provider Platform</div>
        </div>
        <div style={{ padding: '8px 0', flex: 1 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'calendar', label: 'Calendar', icon: '📅' },
          ].map(item => (
            <button key={item.id} onClick={() => setScreen(item.id)}
              style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: screen === item.id ? 'rgba(255,255,255,0.15)' : 'none', border: 'none', color: screen === item.id ? 'white' : 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: screen === item.id ? 'bold' : 'normal' }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
          <NavFolder icon="⚖️" label="Client Compliance" screen={screen} setScreen={setScreen} items={[
            { id: 'checkin', label: 'Client Check-Ins', icon: '📍' },
            { id: 'alerts', label: 'Alerts', icon: '🔔' },
            { id: 'map', label: 'Map View', icon: '🗺️' },
            { id: 'reports', label: 'Reports', icon: '📄' },
            { id: 'violations', label: 'Violations', icon: '🚨' },
            { id: 'chart', label: 'Compliance Chart', icon: '📈' },
          ]} />
          <NavFolder icon="👥" label="Clients" screen={screen} setScreen={setScreen} items={[
            { id: 'clients', label: 'All Clients', icon: '👤' },
            { id: 'messages', label: 'Messages', icon: '✉️' },
            { id: 'contactlog', label: 'Contact Log', icon: '📞' },
            { id: 'documents', label: 'Documents', icon: '📁' },
          ]} />
          <NavFolder icon="📋" label="Operations" screen={screen} setScreen={setScreen} items={[
            { id: 'tasks', label: 'Tasks', icon: '✅' },
            { id: 'programs', label: 'Programs', icon: '🏛️' },
            { id: 'sms', label: 'SMS Alerts', icon: '📱' },
            { id: 'sop', label: 'SOPs', icon: '📋' },
            { id: 'providerguide', label: 'Provider Guide', icon: '📖' },
          ]} />
          <NavFolder icon="🏢" label="Admin" screen={screen} setScreen={setScreen} items={[
            { id: 'orgSettings', label: 'Org Settings', icon: '🏢' },
            { id: 'usermanagement', label: 'User Management', icon: '👨‍💼' },
            { id: 'invite', label: 'Client Invites', icon: '📨' },
            { id: 'paymentplans', label: 'Payment Plans', icon: '💳' },
            { id: 'billinghistory', label: 'Billing History', icon: '🧾' },
            { id: 'certificates', label: 'Certificate of Completion', icon: '🎓' },
          ]} />
          <NavFolder icon="⚙️" label="Settings" screen={screen} setScreen={setScreen} items={[
            { id: 'checkinfreq', label: 'Check-In Frequency', icon: '⏱️' },
            { id: 'alertprefs', label: 'Alert Preferences', icon: '🔔' },
            { id: 'notifemail', label: 'Notification Email', icon: '📧' },
            { id: 'programhours', label: 'Program Hours', icon: '🕐' },
            { id: 'account', label: 'Account', icon: '👤' },
          ]} />
          <NavFolder icon="💙" label="Wellness" screen={screen} setScreen={setScreen} items={[
            { id: 'affirmations', label: 'Affirmations', icon: '💙' },
          ]} />
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
          <NavFolder icon="🔮" label="Phase 2" screen={screen} setScreen={setScreen} items={[
            { id: 'assessments', label: 'Assessments', icon: '📝' },
          ]} />
          <NavFolder icon="🚀" label="Phase 3" screen={screen} setScreen={setScreen} items={[
            { id: 'sensitive', label: 'Sensitive Records', icon: '🔒' },
            { id: 'granttracking', label: 'Grant Tracking', icon: '💰' },
            { id: 'auditreadiness', label: 'Audit Readiness', icon: '✅' },
          ]} />
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '9px', background: '#E74C3C', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>🚪 Log Out</button>
        </div>
      </nav>
      <div style={{ flex: 1, overflowY: 'auto', background: '#f4f6f9' }}>
        {renderScreen()}
      </div>
    </div>
  );
}