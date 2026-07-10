import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import ProviderDashboard from './screens/ProviderDashboard';
import ClientAppDashboard from './screens/ClientAppDashboard';
import ClientOnboarding from './screens/ClientOnboarding';
import SandboxApp from './demo/SandboxApp';
import CheckIn from './screens/CheckIn';
import CheckInHistory from './screens/CheckInHistory';
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

const isSandboxRoute = window.location.pathname === '/sandbox';

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
    if (isEnrollRoute || isSandboxRoute) { setLoading(false); return; }
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

  if (isSandboxRoute) return <SandboxApp />;

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
    color: activeScreen === id ? '#FFFFFF' : '#374151',
    background: activeScreen === id ? BLUE : 'transparent',
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
    color: activeScreen === id ? '#FFFFFF' : '#6B7280',
    background: activeScreen === id ? BLUE : 'transparent',
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
    color: '#374151',
    borderRadius: 6,
    cursor: 'pointer',
    margin: '1px 6px',
    fontFamily: NAV_FONT,
    userSelect: 'none',
  });

  const divider = { margin: '5px 12px', borderTop: '1px solid #E5E7EB' };

  const userInitial = session?.user?.email?.[0]?.toUpperCase() || 'P';
  const userEmail = session?.user?.email || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: NAV_FONT, background: '#F8F9FA' }}>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 40 }} />}

      <div style={{ width: 216, minHeight: '100vh', background: '#F8F9FA', borderRight: '1px solid #E5E7EB', position: 'fixed', top: 0, left: sidebarOpen ? 0 : -216, zIndex: 50, transition: 'left 0.22s ease', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="sidebar">

        <div style={{ padding: '15px 16px 13px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ color: BLUE, fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>CourtBridge</div>
          <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 1 }}>Provider Platform</div>
        </div>

        <div style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>

          <div style={navItem('dashboard')} onClick={() => navTo('dashboard')}>
            <Ic d={ICONS.dashboard} /><span>Dashboard</span>
          </div>
          <div style={navItem('calendar')} onClick={() => navTo('calendar')}>
            <Ic d={ICONS.calendar} /><span>Calendar</span>
          </div>

          <div style={divider} />

          <div style={groupRow('compliance')} onClick={() => toggleMenu('compliance')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={ICONS.compliance} /><span>Compliance</span>
            </div>
            <Ic d={expandedMenus.compliance ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
          </div>
          {expandedMenus.compliance && <>
            <div style={subItem('alerts')} onClick={() => navTo('alerts')}>Alerts</div>
            <div style={subItem('checkin')} onClick={() => navTo('checkin')}>Check-Ins</div>
            <div style={subItem('mapview')} onClick={() => navTo('mapview')}>Map View</div>
            <div style={subItem('reports')} onClick={() => navTo('reports')}>Reports</div>
            <div style={subItem('compliancechart')} onClick={() => navTo('compliancechart')}>Compliance Chart</div>
            <div style={subItem('drugtests')} onClick={() => navTo('drugtests')}>Drug Tests</div>
            <div style={subItem('violationreport')} onClick={() => navTo('violationreport')}>Violations</div>
          </>}

          <div style={divider} />

          <div style={groupRow('clients')} onClick={() => toggleMenu('clients')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={ICONS.clients} /><span>Clients</span>
            </div>
            <Ic d={expandedMenus.clients ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
          </div>
          {expandedMenus.clients && <>
            <div style={subItem('clients')} onClick={() => navTo('clients')}>All Clients</div>
            <div style={subItem('messages')} onClick={() => navTo('messages')}>Messages</div>
            <div style={subItem('contactlog')} onClick={() => navTo('contactlog')}>Contact Log</div>
            <div style={subItem('meetinglog')} onClick={() => navTo('meetinglog')}>Meeting Log</div>
            <div style={subItem('courtdates')} onClick={() => navTo('courtdates')}>Court Dates</div>
            <div style={subItem('povisits')} onClick={() => navTo('povisits')}>PO Visits</div>
            <div style={subItem('cpstracking')} onClick={() => navTo('cpstracking')}>CPS Tracking</div>
          </>}

          <div style={divider} />

          <div style={groupRow('operations')} onClick={() => toggleMenu('operations')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={ICONS.operations} /><span>Operations</span>
            </div>
            <Ic d={expandedMenus.operations ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
          </div>
          {expandedMenus.operations && <>
            <div style={subItem('tasks')} onClick={() => navTo('tasks')}>Tasks</div>
            <div style={subItem('programs')} onClick={() => navTo('programs')}>Programs</div>
            <div style={subItem('sop')} onClick={() => navTo('sop')}>SOPs</div>
            <div style={subItem('providerguide')} onClick={() => navTo('providerguide')}>Provider Guide</div>
            <div style={subItem('policies')} onClick={() => navTo('policies')}>Policies</div>
            <div style={subItem('legal')} onClick={() => navTo('legal')}>Legal</div>
          </>}

          <div style={divider} />

          <div style={groupRow('admin')} onClick={() => toggleMenu('admin')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={ICONS.admin} /><span>Admin</span>
            </div>
            <Ic d={expandedMenus.admin ? ICONS.chevronDown : ICONS.chevronRight} size={12} />
          </div>
          {expandedMenus.admin && <>
            <div style={subItem('orgadmin')} onClick={() => navTo('orgadmin')}>Org Settings</div>
            <div style={subItem('clientinvite')} onClick={() => navTo('clientinvite')}>Client Invites</div>
          </>}

          <div style={divider} />

          <div style={navItem('affirmations')} onClick={() => navTo('affirmations')}>
            <Ic d={ICONS.wellness} /><span>Wellness</span>
          </div>
          <div style={navItem('settings')} onClick={() => navTo('settings')}>
            <Ic d={ICONS.settings} /><span>Settings</span>
          </div>
        </div>

        <div style={{ padding: '10px 12px 12px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', marginBottom: 2 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: BLUE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {userInitial}
            </div>
            <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</span>
          </div>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', fontSize: 12, color: '#9CA3AF', cursor: 'pointer', borderRadius: 5, fontFamily: NAV_FONT }}>
            <Ic d={ICONS.logout} size={13} /><span>Sign out</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex', alignItems: 'center' }}>
            <Ic d={ICONS.menu} size={17} />
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: BLUE, letterSpacing: '-0.2px' }}>CourtBridge Solutions</div>
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
