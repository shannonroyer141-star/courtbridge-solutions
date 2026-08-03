import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ProviderDashboard from './screens/ProviderDashboard';
import ClientAppDashboard from './screens/ClientAppDashboard';
import ClientOnboarding from './screens/ClientOnboarding';
import SandboxApp from './demo/SandboxApp';
import SelfServeSignup from './screens/SelfServeSignup';
import SignupSuccess from './screens/SignupSuccess';
import ProviderSetupWizard from './screens/ProviderSetupWizard';
import UserRoleManagement from './screens/UserRoleManagement';
import JcxDirectory from './screens/JcxDirectory';
import JcxResources from './screens/JcxResources';
import JcxReferrals from './screens/JcxReferrals';
import JcxRecordsRequests from './screens/JcxRecordsRequests';
import RecordsRequestForm from './screens/RecordsRequestForm';
import CheckIn from './screens/CheckIn';
import CheckInHistory from './screens/CheckInHistory';
import Clients from './screens/Clients';
import Forms from './screens/Forms';
import Alerts from './screens/Alerts';
import Reports from './screens/Reports';
import DrugTests from './screens/DrugTests';
import Tasks from './screens/Tasks';
import CourtDates from './screens/CourtDates';
import Calendar from './screens/Calendar';
import Affirmations from './screens/Affirmations';
import Settings from './screens/Settings';
import ContactLog from './screens/ContactLog';
import Programs from './screens/Programs';
import POVisits from './screens/POVisits';
import CPSTracking from './screens/CPSTracking';
import ComplianceChart from './screens/ComplianceChart';
import MapView from './screens/MapView';
import MeetingLog from './screens/MeetingLog';
import OrgAdmin from './screens/OrgAdmin';
import ClientProfile from './screens/ClientProfile';
import Messages from './screens/Messages';
import ClientInvite from './screens/ClientInvite';
import ViolationReport from './screens/ViolationReport';
import FounderDocs from './screens/FounderDocs';
import BusinessOrganizer from './screens/BusinessOrganizer';
import ProviderOnboarding from './screens/ProviderOnboarding';
import DocumentUpload from './screens/DocumentUpload';
import CompletionCertificate from './screens/CompletionCertificate';
import SensitiveNotes from './screens/SensitiveNotes';
import ClientIntake from './screens/ClientIntake';
import SMSAlerts from './screens/SMSAlerts';
import StaffCredentialing from './screens/StaffCredentialing';
import ComplianceRequirements from './screens/ComplianceRequirements';
import FundingSources from './screens/FundingSources';
import AuditReadiness from './screens/AuditReadiness';
import Assessments from './screens/Assessments';
import { BLUE, DARK_BG, CARD_BG, ACCENT, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from './theme';

const isEnrollRoute = window.location.pathname === '/enroll' &&
  new URLSearchParams(window.location.search).has('token');

const isSandboxRoute = window.location.pathname === '/sandbox';

const isSignupRoute = window.location.pathname === '/signup';
const isSignupSuccessRoute = window.location.pathname === '/signup/success';
const isRecordsRequestRoute = window.location.pathname === '/request-records';

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [expandedMenus, setExpandedMenus] = useState({
    clients: false, sensitive: false, founder: false,
    workflow: false, orgwide: false, operational: false, personal: false,
    jcx: false
  });
  const [pendingInvites, setPendingInvites] = useState(0);
  const [isFounder, setIsFounder] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [accountStatus, setAccountStatus] = useState('active');
  const [activeClientId, setActiveClientId] = useState(null);
  const [cameFromWidget, setCameFromWidget] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = e => { setIsDesktop(e.matches); setSidebarOpen(e.matches); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isEnrollRoute || isSandboxRoute || isSignupRoute || isSignupSuccessRoute || isRecordsRequestRoute) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchRole(userId) {
    const { data } = await supabase.from('profiles').select('role, is_founder, is_org_admin, onboarding_complete, account_status').eq('id', userId).single();
    setRole(data?.role || 'provider');
    setIsFounder(!!data?.is_founder);
    setIsOrgAdmin(!!data?.is_org_admin);
    setAccountStatus(data?.account_status || 'active');
    setNeedsSetup(data?.role !== 'client' && !data?.onboarding_complete && (!!data?.is_org_admin || !!data?.is_founder));
    setLoading(false);
    fetchPendingInvites(userId);
  }

  function handleSetupDone(goToClients) {
    setNeedsSetup(false);
    if (goToClients) navTo('clients');
  }

  async function fetchPendingInvites(userId) {
    const { count } = await supabase.from('invites')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', userId)
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString());
    setPendingInvites(count || 0);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setLoginError(error.message);
    setLoginLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setActiveScreen('dashboard');
  }

  function toggleMenu(menu) {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  }

  function navTo(screen, clientId = null, fromWidget = false) {
    setActiveScreen(screen);
    setActiveClientId(clientId);
    setCameFromWidget(fromWidget);
    if (!isDesktop) setSidebarOpen(false);
  }

  if (isEnrollRoute) return <ClientOnboarding />;

  if (isSandboxRoute) return <SandboxApp />;

  if (isSignupRoute) return <SelfServeSignup />;

  if (isSignupSuccessRoute) return <SignupSuccess />;

  if (isRecordsRequestRoute) return <RecordsRequestForm />;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_BG, fontFamily: NAV_FONT }}>
      <div style={{ color: TEXT_MUTED, fontSize: 16 }}>Loading...</div>
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {isDesktop && (
        <div style={{
          flex: '1 1 50%', background: 'linear-gradient(160deg, #0A1628 0%, #152540 55%, #1B3A6B 100%)',
          color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '60px 64px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -120, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'relative', maxWidth: 440 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: '#7A8FA6', textTransform: 'uppercase', marginBottom: 18 }}>
              Specialty Court Compliance Platform
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.25, marginBottom: 20 }}>
              CourtBridge Solutions
            </div>
            <div style={{ fontSize: 15, color: '#C8D0DC', lineHeight: 1.6, marginBottom: 36 }}>
              GPS-verified check-ins, real-time compliance alerts, and court-ready reporting — all in one place.
            </div>
            {[
              'Real-time GPS check-in verification',
              'Instant alerts on missed check-ins',
              'Two-way messaging with urgent escalation',
              'Court-ready compliance reports',
            ].map((line, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8FB4E0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: 14, color: '#E8EAED' }}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ flex: isDesktop ? '1 1 50%' : '1 1 100%', background: DARK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {!isDesktop && (
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ color: TEXT, fontSize: 22, fontWeight: 800 }}>CourtBridge Solutions</div>
              <div style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>Provider Platform</div>
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 28 }}>Sign in to your CourtBridge portal</div>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '12px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none', background: 'rgba(255,255,255,0.04)', color: TEXT }}
                placeholder="your@email.com" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '12px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none', background: 'rgba(255,255,255,0.04)', color: TEXT }}
                placeholder="••••••••" />
            </div>
            {loginError && <div style={{ color: '#F87171', fontSize: 13, marginBottom: 16 }}>{loginError}</div>}
            <button type="submit" disabled={loginLoading}
              style={{ width: '100%', padding: 14, background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  if (role === 'client') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        {activeScreen === 'dashboard' && <ClientAppDashboard session={session} onLogout={handleLogout} onNavigate={navTo} />}
        {activeScreen === 'checkin' && <CheckIn session={session} onBack={() => navTo('dashboard')} />}
      </div>
    );
  }

  if (accountStatus === 'inactive') {
    return (
      <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: NAV_FONT }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 19, fontWeight: 600, color: TEXT, marginBottom: 10 }}>Your account has been deactivated</div>
          <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 20 }}>
            Contact your organization's admin if you believe this is a mistake.
          </div>
          <div onClick={handleLogout} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: TEXT, fontSize: 13, padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>Log Out</div>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <ProviderSetupWizard session={session} onDone={handleSetupDone} />;
  }

  function renderMain() {
    switch (activeScreen) {
      case 'dashboard': return <ProviderDashboard session={session} onNavigate={(screen, clientId) => navTo(screen, clientId, true)} />;
      case 'clients': return <Clients session={session} onNavigate={navTo} />;
      case 'forms': return <Forms session={session} />;
      case 'checkin': return <CheckInHistory session={session} />;
      case 'alerts': return <Alerts session={session} />;
      case 'reports': return <Reports session={session} />;
      case 'drugtests': return <DrugTests session={session} />;
      case 'tasks': return <Tasks session={session} />;
      case 'courtdates': return <CourtDates session={session} />;
      case 'calendar': return <Calendar session={session} />;
      case 'affirmations': return <Affirmations session={session} />;
      case 'settings': return <Settings session={session} />;
      case 'contactlog': return <ContactLog session={session} />;
      case 'programs': return <Programs session={session} />;
      case 'povisits': return <POVisits session={session} />;
      case 'cpstracking': return <CPSTracking session={session} />;
      case 'compliancechart': return <ComplianceChart session={session} />;
      case 'mapview': return <MapView session={session} />;
      case 'meetinglog': return <MeetingLog session={session} />;
      case 'orgadmin': return <OrgAdmin session={session} />;
      case 'clientprofile': return <ClientProfile session={session} clientId={activeClientId} onNavigate={navTo} />;
      case 'messages': return <Messages session={session} clientId={activeClientId} />;
      case 'clientinvite': return <ClientInvite session={session} />;
      case 'violationreport': return <ViolationReport session={session} />;
      case 'founderdocs': return <FounderDocs session={session} />;
      case 'businessorganizer': return <BusinessOrganizer session={session} />;
      case 'provideronboarding': return <ProviderOnboarding session={session} />;
      case 'documents': return <DocumentUpload session={session} />;
      case 'certificates': return <CompletionCertificate session={session} />;
      case 'sensitivenotes': return <SensitiveNotes session={session} />;
      case 'clientintake': return <ClientIntake session={session} />;
      case 'smsalerts': return <SMSAlerts session={session} />;
      case 'staffcredentialing': return <StaffCredentialing session={session} />;
      case 'compliancerequirements': return <ComplianceRequirements session={session} />;
      case 'fundingsources': return <FundingSources session={session} />;
      case 'auditreadiness': return <AuditReadiness session={session} />;
      case 'assessments': return <Assessments />;
      case 'userrolemanagement': return <UserRoleManagement session={session} />;
      case 'jcxdirectory': return <JcxDirectory session={session} />;
      case 'jcxresources': return <JcxResources session={session} />;
      case 'jcxreferrals': return <JcxReferrals session={session} />;
      case 'jcxrecordsrequests': return <JcxRecordsRequests session={session} />;
      default: return <ProviderDashboard session={session} onNavigate={navTo} />;
    }
  }

  const Ic = ({ d, size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}>
      {d}
    </svg>
  );

  const ICONS = {
    dashboard:   <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
    calendar:    <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    compliance:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
    clients:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    operations:  <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></>,
    admin:       <><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/><line x1="12" y1="12" x2="12" y2="22"/></>,
    wellness:    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    settings:    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.17l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    logout:      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chevronDown:  <polyline points="6 9 12 15 18 9"/>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    menu:        <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  };

  const navItem = (id) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    fontSize: 13,
    fontWeight: activeScreen === id ? 500 : 400,
    color: activeScreen === id ? TEXT : 'rgba(255,255,255,0.65)',
    background: activeScreen === id ? ACCENT : 'transparent',
    borderRadius: 6,
    cursor: 'pointer',
    margin: '1px 6px',
    fontFamily: NAV_FONT,
    letterSpacing: '0.01em',
    userSelect: 'none',
  });

  const subItem = (id) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '5px 10px 5px 30px',
    fontSize: 12.5,
    fontWeight: activeScreen === id ? 500 : 400,
    color: activeScreen === id ? TEXT : 'rgba(255,255,255,0.5)',
    background: activeScreen === id ? ACCENT : 'transparent',
    borderRadius: 6,
    cursor: 'pointer',
    margin: '1px 6px',
    fontFamily: NAV_FONT,
    userSelect: 'none',
  });

  const groupRow = (menu) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    fontSize: 13,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.65)',
    borderRadius: 6,
    cursor: 'pointer',
    margin: '1px 6px',
    fontFamily: NAV_FONT,
    userSelect: 'none',
  });

  const subGroupRow = (menu) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5px 10px 5px 26px',
    fontSize: 12.5,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
    cursor: 'pointer',
    margin: '1px 6px',
    fontFamily: NAV_FONT,
    userSelect: 'none',
  });

  const subSubItem = (id) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '5px 10px 5px 46px',
    fontSize: 12,
    fontWeight: activeScreen === id ? 500 : 400,
    color: activeScreen === id ? TEXT : 'rgba(255,255,255,0.45)',
    background: activeScreen === id ? ACCENT : 'transparent',
    borderRadius: 6,
    cursor: 'pointer',
    margin: '1px 6px',
    fontFamily: NAV_FONT,
    userSelect: 'none',
  });

  const divider = { margin: '5px 12px', borderTop: `0.5px solid ${BORDER}` };

  const userInitial = session?.user?.email?.[0]?.toUpperCase() || 'P';
  const userEmail = session?.user?.email || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: NAV_FONT, background: DARK_BG }}>

      {!isDesktop && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />}

      <div style={{
        width: sidebarOpen ? 216 : 0,
        minHeight: '100vh',
        background: DARK_BG,
        borderRight: sidebarOpen ? `0.5px solid ${BORDER}` : 'none',
        position: isDesktop ? 'relative' : 'fixed',
        top: 0,
        left: isDesktop ? 'auto' : (sidebarOpen ? 0 : -216),
        flexShrink: 0,
        zIndex: 50,
        overflow: 'hidden',
        transition: isDesktop ? 'width 0.22s ease' : 'left 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
      }} className="sidebar">

        <div style={{ padding: '15px 16px 13px', borderBottom: `0.5px solid ${BORDER}` }}>
          <div style={{ color: TEXT, fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>CourtBridge</div>
          <div style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 1 }}>Provider Platform</div>
        </div>

        <div style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>

          <div style={navItem('dashboard')} onClick={() => navTo('dashboard')}>
            <Ic d={ICONS.dashboard} /><span>Dashboard</span>
          </div>
          <div style={navItem('calendar')} onClick={() => navTo('calendar')}>
            <Ic d={ICONS.calendar} /><span>Calendar</span>
          </div>
          <div style={navItem('alerts')} onClick={() => navTo('alerts')}>
            <Ic d={ICONS.compliance} /><span>Alerts</span>
          </div>
          <div style={navItem('messages')} onClick={() => navTo('messages')}>
            <Ic d={ICONS.clients} /><span>Messages</span>
          </div>
          <div style={navItem('clientinvite')} onClick={() => navTo('clientinvite')}>
            <Ic d={ICONS.admin} /><span style={{ flex: 1 }}>Client Invites</span>
            {pendingInvites > 0 && (
              <span style={{ background: '#fff', color: '#000', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 7px' }}>{pendingInvites}</span>
            )}
          </div>

          <div style={divider} />

          <div style={groupRow('clients')} onClick={() => toggleMenu('clients')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={ICONS.clients} /><span>Clients</span>
            </div>
            <Ic d={expandedMenus.clients ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
          </div>
          {expandedMenus.clients && <>
            <div style={subItem('clients')} onClick={() => navTo('clients')}>All Clients</div>
            <div style={subItem('certificates')} onClick={() => navTo('certificates')}>Certificates</div>
            <div style={subItem('checkin')} onClick={() => navTo('checkin')}>Check-Ins</div>
            <div style={subItem('clientintake')} onClick={() => navTo('clientintake')}>Client Intake</div>
            <div style={subItem('mapview')} onClick={() => navTo('mapview')}>Map View</div>
            <div style={subItem('programs')} onClick={() => navTo('programs')}>Programs</div>
            <div style={subItem('smsalerts')} onClick={() => navTo('smsalerts')}>SMS Alerts</div>
            <div style={subItem('tasks')} onClick={() => navTo('tasks')}>Tasks</div>

            <div style={subGroupRow('sensitive')} onClick={() => toggleMenu('sensitive')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ic d={ICONS.admin} size={12} /><span>Sensitive Records</span>
              </div>
              <Ic d={expandedMenus.sensitive ? ICONS.chevronDown : ICONS.chevronRight} size={11} />
            </div>
            {expandedMenus.sensitive && <>
              <div style={subSubItem('sensitivenotes')} onClick={() => navTo('sensitivenotes')}>Case &amp; Clinical Notes</div>
              <div style={subSubItem('assessments')} onClick={() => navTo('assessments')}>Assessments</div>
              <div style={subSubItem('contactlog')} onClick={() => navTo('contactlog')}>Contact Log</div>
              <div style={subSubItem('courtdates')} onClick={() => navTo('courtdates')}>Court Dates</div>
              <div style={subSubItem('cpstracking')} onClick={() => navTo('cpstracking')}>CPS Tracking</div>
              <div style={subSubItem('documents')} onClick={() => navTo('documents')}>Documents</div>
              <div style={subSubItem('drugtests')} onClick={() => navTo('drugtests')}>Drug Tests</div>
              <div style={subSubItem('meetinglog')} onClick={() => navTo('meetinglog')}>Meeting Log</div>
              <div style={subSubItem('povisits')} onClick={() => navTo('povisits')}>PO Visits</div>
              <div style={subSubItem('reports')} onClick={() => navTo('reports')}>Reports</div>
              <div style={subSubItem('violationreport')} onClick={() => navTo('violationreport')}>Violations</div>
            </>}
          </>}

          <div style={divider} />

          <div style={groupRow('jcx')} onClick={() => toggleMenu('jcx')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={ICONS.wellness} /><span>Justice Collaboration</span>
            </div>
            <Ic d={expandedMenus.jcx ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
          </div>
          {expandedMenus.jcx && <>
            <div style={subItem('jcxdirectory')} onClick={() => navTo('jcxdirectory')}>Agency Directory</div>
            <div style={subItem('jcxresources')} onClick={() => navTo('jcxresources')}>Resource Marketplace</div>
            <div style={subItem('jcxreferrals')} onClick={() => navTo('jcxreferrals')}>Referrals</div>
            <div style={subItem('jcxrecordsrequests')} onClick={() => navTo('jcxrecordsrequests')}>Records Requests</div>
          </>}

          <div style={divider} />

          <div style={groupRow('workflow')} onClick={() => toggleMenu('workflow')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={ICONS.settings} /><span>Workflow Studio</span>
            </div>
            <Ic d={expandedMenus.workflow ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
          </div>
          {expandedMenus.workflow && <>
            {(isOrgAdmin || isFounder) && (
              <>
                <div style={subGroupRow('orgwide')} onClick={() => toggleMenu('orgwide')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ic d={ICONS.admin} size={12} /><span>Org-Wide</span>
                  </div>
                  <Ic d={expandedMenus.orgwide ? ICONS.chevronDown : ICONS.chevronRight} size={11} />
                </div>
                {expandedMenus.orgwide && <>
                  <div style={subSubItem('orgadmin')} onClick={() => navTo('orgadmin')}>Org Settings</div>
                  <div style={subSubItem('userrolemanagement')} onClick={() => navTo('userrolemanagement')}>User &amp; Role Management</div>
                  <div style={subSubItem('compliancerequirements')} onClick={() => navTo('compliancerequirements')}>Compliance Requirements</div>
                  <div style={subSubItem('auditreadiness')} onClick={() => navTo('auditreadiness')}>Audit Readiness</div>
                  <div style={subSubItem('fundingsources')} onClick={() => navTo('fundingsources')}>Funding Sources</div>
                  <div style={subSubItem('staffcredentialing')} onClick={() => navTo('staffcredentialing')}>Staff Credentialing</div>
                </>}
              </>
            )}

            <div style={subGroupRow('operational')} onClick={() => toggleMenu('operational')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ic d={ICONS.operations} size={12} /><span>Operational</span>
              </div>
              <Ic d={expandedMenus.operational ? ICONS.chevronDown : ICONS.chevronRight} size={11} />
            </div>
            {expandedMenus.operational && <>
              <div style={subSubItem('tasks')} onClick={() => navTo('tasks')}>Tasks</div>
              <div style={subSubItem('programs')} onClick={() => navTo('programs')}>Programs</div>
              <div style={subSubItem('compliancechart')} onClick={() => navTo('compliancechart')}>Compliance Chart</div>
            </>}

            <div style={subGroupRow('personal')} onClick={() => toggleMenu('personal')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Ic d={ICONS.wellness} size={12} /><span>Personal</span>
              </div>
              <Ic d={expandedMenus.personal ? ICONS.chevronDown : ICONS.chevronRight} size={11} />
            </div>
            {expandedMenus.personal && <>
              <div style={subSubItem('settings')} onClick={() => navTo('settings')}>My Preferences</div>
              <div style={subSubItem('affirmations')} onClick={() => navTo('affirmations')}>Wellness</div>
            </>}
          </>}

          <div style={divider} />

          {isFounder && (
            <>
              <div style={groupRow('founder')} onClick={() => toggleMenu('founder')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ic d={ICONS.admin} /><span>Founder</span>
                </div>
                <Ic d={expandedMenus.founder ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
              </div>
              {expandedMenus.founder && <>
                <div style={subItem('founderdocs')} onClick={() => navTo('founderdocs')}>Founder Docs</div>
                <div style={subItem('businessorganizer')} onClick={() => navTo('businessorganizer')}>Business Organizer</div>
                <div style={subItem('forms')} onClick={() => navTo('forms')}>Forms &amp; Signatures</div>
                <div style={subItem('provideronboarding')} onClick={() => navTo('provideronboarding')}>Provider Onboarding</div>
              </>}
            </>
          )}
        </div>

        <div style={{ padding: '10px 12px 12px', borderTop: `0.5px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', marginBottom: 2 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {userInitial}
            </div>
            <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
          </div>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', fontSize: 12, color: TEXT_MUTED, cursor: 'pointer', borderRadius: 5, fontFamily: NAV_FONT }}>
            <Ic d={ICONS.logout} size={13} /><span>Sign out</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: CARD_BG, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `0.5px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: 4, display: 'flex', alignItems: 'center' }}>
            <Ic d={ICONS.menu} size={17} />
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, letterSpacing: '-0.2px' }}>CourtBridge Solutions</div>
        </div>
        <div style={{ flex: 1, padding: 20, background: DARK_BG }}>
          {cameFromWidget && activeScreen !== 'dashboard' && (
            <div
              onClick={() => navTo('dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
                padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                color: TEXT_MUTED, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: NAV_FONT,
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to Dashboard
            </div>
          )}
          {renderMain()}
        </div>
      </div>
    </div>
  );
}
