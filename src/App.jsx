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

  const NavItem = ({ id, label, sub = false }) => (
    <div onClick={() => navTo(id)} style={{
      padding: sub ? '8px 16px 8px 32px' : '10px 16px',
      fontSize: sub ? 13 : 14,
      fontWeight: activeScreen === id ? 600 : 400,
      color: activeScreen === id ? '#fff' : sub ? '#A8C4E0' : '#C8D8EE',
      background: activeScreen === id ? 'rgba(255,255,255,0.15)' : 'transparent',
      borderRadius: 6, cursor: 'pointer', marginBottom: 2,
      borderLeft: activeScreen === id ? '3px solid #fff' : '3px solid transparent',
    }}>
      {label}
    </div>
  );

  const MenuToggle = ({ menu, label }) => (
    <div onClick={() => toggleMenu(menu)} style={{ padding: '10px 16px', fontSize: 14, color: '#C8D8EE', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
      <span>{label}</span>
      <span style={{ fontSize: 10, opacity: 0.7 }}>{expandedMenus[menu] ? '▲' : '▼'}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', background: '#F5F6F8' }}>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />}

      <div style={{ width: 220, minHeight: '100vh', background: BLUE, position: 'fixed', top: 0, left: sidebarOpen ? 0 : -220, zIndex: 50, transition: 'left 0.25s', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="sidebar">
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>CourtBridge Solutions</div>
          <div style={{ color: '#A8C4E0', fontSize: 11, marginTop: 2 }}>Provider Platform</div>
        </div>

        <div style={{ flex: 1, padding: '12px 8px' }}>
          <NavItem id="dashboard" label="Dashboard" />
          <NavItem id="calendar" label="Calendar" />

          <MenuToggle menu="compliance" label="Client Compliance" />
          {expandedMenus.compliance && (
            <>
              <NavItem id="alerts" label="Alerts" sub />
              <NavItem id="checkin" label="Check-Ins" sub />
              <NavItem id="mapview" label="Map View" sub />
              <NavItem id="reports" label="Reports" sub />
              <NavItem id="compliancechart" label="Compliance Chart" sub />
              <NavItem id="drugtests" label="Drug Tests" sub />
              <NavItem id="violationreport" label="Violations" sub />
            </>
          )}

          <MenuToggle menu="clients" label="Clients" />
          {expandedMenus.clients && (
            <>
              <NavItem id="clients" label="All Clients" sub />
              <NavItem id="messages" label="Messages" sub />
              <NavItem id="contactlog" label="Contact Log" sub />
              <NavItem id="meetinglog" label="Meeting Log" sub />
              <NavItem id="courtdates" label="Court Dates" sub />
              <NavItem id="povisits" label="PO Visits" sub />
              <NavItem id="cpstracking" label="CPS Tracking" sub />
            </>
          )}

          <MenuToggle menu="operations" label="Operations" />
          {expandedMenus.operations && (
            <>
              <NavItem id="tasks" label="Tasks" sub />
              <NavItem id="programs" label="Programs" sub />
              <NavItem id="sop" label="SOPs" sub />
              <NavItem id="providerguide" label="Provider Guide" sub />
              <NavItem id="policies" label="Policies" sub />
              <NavItem id="legal" label="Legal" sub />
            </>
          )}

          <MenuToggle menu="admin" label="Admin" />
          {expandedMenus.admin && (
            <>
              <NavItem id="orgadmin" label="Org Settings" sub />
              <NavItem id="clientinvite" label="Client Invites" sub />
            </>
          )}

          <NavItem id="affirmations" label="Wellness" />
          <NavItem id="settings" label="Settings" />

          <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ padding: '6px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coming Soon</div>
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Phase 2 — Assessments</div>
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Phase 3 — Court Portal</div>
        </div>

        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div onClick={handleLogout} style={{ padding: '10px 16px', fontSize: 13, color: '#A8C4E0', cursor: 'pointer', borderRadius: 6 }}>Sign Out</div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: BLUE, padding: 4 }}>☰</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: BLUE }}>CourtBridge Solutions</div>
        </div>
        <div style={{ flex: 1, padding: 20 }}>{renderMain()}</div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar { left: 0 !important; }
          .sidebar + div { margin-left: 220px !important; }
        }
      `}</style>
    </div>
  );
}