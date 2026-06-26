import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ProviderDashboard from './screens/ProviderDashboard';
import ClientAppDashboard from './screens/ClientAppDashboard';
import ClientOnboarding from './screens/ClientOnboarding';
import CheckIn from './screens/CheckIn';
import Clients from './screens/Clients';
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
import Policies from './screens/Policies';
import ClientProfile from './screens/ClientProfile';
import NonCompete from './screens/NonCompete';
import Legal from './screens/Legal';
import ProviderGuide from './screens/ProviderGuide';
import SOP from './screens/SOP';
import Messages from './screens/Messages';
import ClientInvite from './screens/ClientInvite';
import ViolationReport from './screens/ViolationReport';

const BLUE = '#1B3A6B';

const NAV_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const isEnrollRoute = window.location.pathname === '/enroll' &&
  new URLSearchParams(window.location.search).has('token');

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    compliance: false, clients: false, operations: false, admin: false
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isEnrollRoute) { setLoading(false); return; }
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
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    setRole(data?.role || 'provider');
    setLoading(false);
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

  function navTo(screen) {
    setActiveScreen(screen);
    setSidebarOpen(false);
  }

  if (isEnrollRoute) return <ClientOnboarding />;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6F8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ color: BLUE, fontSize: 16 }}>Loading...</div>
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: '100vh', background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        <div style={{ background: BLUE, padding: '32px 32px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>CourtBridge Solutions</div>
          <div style={{ color: '#A8C4E0', fontSize: 13, marginTop: 4 }}>Provider Platform</div>
        </div>
        <form onSubmit={handleLogin} style={{ padding: '28px 32px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
              placeholder="your@email.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
              placeholder="••••••••" />
          </div>
          {loginError && <div style={{ color: '#cc0000', fontSize: 13, marginBottom: 16 }}>{loginError}</div>}
          <button type="submit" disabled={loginLoading}
            style={{ width: '100%', padding: 14, background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}>
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
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

  function renderMain() {
    switch (activeScreen) {
      case 'dashboard': return <ProviderDashboard session={session} onNavigate={navTo} />;
      case 'clients': return <Clients session={session} />;
      case 'checkin': return <CheckIn session={session} onBack={() => navTo('dashboard')} />;
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
      case 'policies': return <Policies session={session} />;
      case 'clientprofile': return <ClientProfile session={session} />;
      case 'noncompete': return <NonCompete session={session} />;
      case 'legal': return <Legal session={session} />;
      case 'providerguide': return <ProviderGuide session={session} />;
      case 'sop': return <SOP session={session} />;
      case 'messages': return <Messages session={session} />;
      case 'clientinvite': return <ClientInvite session={session} />;
      case 'violationreport': return <ViolationReport session={session} />;
      default: return <ProviderDashboard session={session} onNavigate={navTo} />;
    }
  }

  const ni = (id) => ({
    display: 'block',
    padding: '5px 10px',
    fontSize: 13,
    fontWeight: activeScreen === id ? 600 : 400,
    color: activeScreen === id ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
    background: activeScreen === id ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: activeScreen === id ? '2px solid rgba(255,255,255,0.85)' : '2px solid transparent',
    borderRadius: '0 5px 5px 0',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    transition: 'background 0.1s, color 0.1s',
    fontFamily: NAV_FONT,
  });

  const niSub = (id) => ({
    ...ni(id),
    padding: '4px 10px 4px 22px',
    fontSize: 12,
    color: activeScreen === id ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
  });

  const sectionLabel = {
    padding: '14px 10px 4px',
    fontSize: 10,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: NAV_FONT,
    userSelect: 'none',
  };

  const groupToggle = (menu) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 10px',
    fontSize: 13,
    color: expandedMenus[menu] ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontFamily: NAV_FONT,
    letterSpacing: '0.01em',
    borderLeft: '2px solid transparent',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: NAV_FONT, background: '#F5F6F8' }}>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40 }} />}

      <div style={{ width: 216, minHeight: '100vh', background: BLUE, position: 'fixed', top: 0, left: sidebarOpen ? 0 : -216, zIndex: 50, transition: 'left 0.22s ease', overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)' }} className="sidebar">

        <div style={{ padding: '16px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>CourtBridge</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Provider Platform</div>
        </div>

        <div style={{ flex: 1, padding: '8px 0' }}>

          <div style={sectionLabel}>Overview</div>
          <div style={ni('dashboard')} onClick={() => navTo('dashboard')}>Dashboard</div>
          <div style={ni('calendar')} onClick={() => navTo('calendar')}>Calendar</div>

          <div style={sectionLabel}>Compliance</div>
          <div style={groupToggle('compliance')} onClick={() => toggleMenu('compliance')}>
            <span>Client Compliance</span>
            <span style={{ fontSize: 9, opacity: 0.6 }}>{expandedMenus.compliance ? '▲' : '▼'}</span>
          </div>
          {expandedMenus.compliance && (
            <>
              <div style={niSub('alerts')} onClick={() => navTo('alerts')}>Alerts</div>
              <div style={niSub('checkin')} onClick={() => navTo('checkin')}>Check-Ins</div>
              <div style={niSub('mapview')} onClick={() => navTo('mapview')}>Map View</div>
              <div style={niSub('reports')} onClick={() => navTo('reports')}>Reports</div>
              <div style={niSub('compliancechart')} onClick={() => navTo('compliancechart')}>Compliance Chart</div>
              <div style={niSub('drugtests')} onClick={() => navTo('drugtests')}>Drug Tests</div>
              <div style={niSub('violationreport')} onClick={() => navTo('violationreport')}>Violations</div>
            </>
          )}

          <div style={sectionLabel}>Clients</div>
          <div style={groupToggle('clients')} onClick={() => toggleMenu('clients')}>
            <span>Client Management</span>
            <span style={{ fontSize: 9, opacity: 0.6 }}>{expandedMenus.clients ? '▲' : '▼'}</span>
          </div>
          {expandedMenus.clients && (
            <>
              <div style={niSub('clients')} onClick={() => navTo('clients')}>All Clients</div>
              <div style={niSub('messages')} onClick={() => navTo('messages')}>Messages</div>
              <div style={niSub('contactlog')} onClick={() => navTo('contactlog')}>Contact Log</div>
              <div style={niSub('meetinglog')} onClick={() => navTo('meetinglog')}>Meeting Log</div>
              <div style={niSub('courtdates')} onClick={() => navTo('courtdates')}>Court Dates</div>
              <div style={niSub('povisits')} onClick={() => navTo('povisits')}>PO Visits</div>
              <div style={niSub('cpstracking')} onClick={() => navTo('cpstracking')}>CPS Tracking</div>
            </>
          )}

          <div style={sectionLabel}>Operations</div>
          <div style={groupToggle('operations')} onClick={() => toggleMenu('operations')}>
            <span>Operations</span>
            <span style={{ fontSize: 9, opacity: 0.6 }}>{expandedMenus.operations ? '▲' : '▼'}</span>
          </div>
          {expandedMenus.operations && (
            <>
              <div style={niSub('tasks')} onClick={() => navTo('tasks')}>Tasks</div>
              <div style={niSub('programs')} onClick={() => navTo('programs')}>Programs</div>
              <div style={niSub('sop')} onClick={() => navTo('sop')}>SOPs</div>
              <div style={niSub('providerguide')} onClick={() => navTo('providerguide')}>Provider Guide</div>
              <div style={niSub('policies')} onClick={() => navTo('policies')}>Policies</div>
              <div style={niSub('legal')} onClick={() => navTo('legal')}>Legal</div>
            </>
          )}

          <div style={sectionLabel}>Admin</div>
          <div style={groupToggle('admin')} onClick={() => toggleMenu('admin')}>
            <span>Administration</span>
            <span style={{ fontSize: 9, opacity: 0.6 }}>{expandedMenus.admin ? '▲' : '▼'}</span>
          </div>
          {expandedMenus.admin && (
            <>
              <div style={niSub('orgadmin')} onClick={() => navTo('orgadmin')}>Org Settings</div>
              <div style={niSub('clientinvite')} onClick={() => navTo('clientinvite')}>Client Invites</div>
            </>
          )}

          <div style={{ margin: '10px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }} />
          <div style={ni('affirmations')} onClick={() => navTo('affirmations')}>Wellness</div>
          <div style={ni('settings')} onClick={() => navTo('settings')}>Settings</div>
        </div>

        <div style={{ padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div onClick={handleLogout} style={{ padding: '6px 10px', fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: NAV_FONT, letterSpacing: '0.01em' }}>Sign out</div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', padding: '11px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #EAECF0', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: BLUE, padding: '2px 4px', lineHeight: 1 }}>☰</button>
          <div style={{ fontSize: 14, fontWeight: 600, color: BLUE, letterSpacing: '-0.1px' }}>CourtBridge Solutions</div>
        </div>
        <div style={{ flex: 1, padding: 20 }}>{renderMain()}</div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar { left: 0 !important; }
          .sidebar + div { margin-left: 216px !important; }
        }
      `}</style>
    </div>
  );
}