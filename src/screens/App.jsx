import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import ProviderDashboard from './components/ProviderDashboard'
import ClientAppDashboard from './components/ClientAppDashboard'
import ClientOnboarding from './components/ClientOnboarding'
import Calendar from './components/Calendar'
import Clients from './components/Clients'
import CheckIn from './components/CheckIn'
import Alerts from './components/Alerts'
import Tasks from './components/Tasks'
import Programs from './components/Programs'
import SMSAlerts from './components/SMSAlerts'
import SOPs from './components/SOPs'
import ProviderGuide from './components/ProviderGuide'
import OrgSettings from './components/OrgSettings'
import UserManagement from './components/UserManagement'
import ClientInvites from './components/ClientInvites'
import PaymentPlans from './components/PaymentPlans'
import BillingHistory from './components/BillingHistory'
import CertificateOfCompletion from './components/CertificateOfCompletion'
import Settings from './components/Settings'
import Affirmations from './components/Affirmations'
import Assessments from './components/Assessments'
import Documents from './components/Documents'
import Messages from './components/Messages'
import ContactLog from './components/ContactLog'
import ClientCheckins from './components/ClientCheckins'
import MapView from './components/MapView'
import Reports from './components/Reports'
import Violations from './components/Violations'
import ComplianceChart from './components/ComplianceChart'

const BLUE = '#1B3A6B'

const isEnrollRoute = window.location.pathname === '/enroll' &&
  new URLSearchParams(window.location.search).has('token')

export default function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [activeSubSection, setActiveSubSection] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({
    clientCompliance: false,
    clients: false,
    operations: false,
    admin: false
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (isEnrollRoute) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else { setRole(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole(data?.role || 'provider')
    setLoading(false)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError(error.message)
    setLoginLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setActiveSection('dashboard')
    setActiveSubSection(null)
  }

  function toggleMenu(menu) {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }))
  }

  function navTo(section, sub = null) {
    setActiveSection(section)
    setActiveSubSection(sub)
    setSidebarOpen(false)
  }

  if (isEnrollRoute) return <ClientOnboarding />

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F6F8', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ color: BLUE, fontSize: 16 }}>Loading...</div>
    </div>
  )

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
  )

  if (role === 'client') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        {activeSection === 'dashboard' && <ClientAppDashboard session={session} onLogout={handleLogout} onNavigate={navTo} />}
        {activeSection === 'checkin' && <CheckIn session={session} onBack={() => navTo('dashboard')} />}
      </div>
    )
  }

  const currentSection = activeSubSection || activeSection

  function renderMain() {
    switch (currentSection) {
      case 'dashboard': return <ProviderDashboard session={session} />
      case 'calendar': return <Calendar session={session} />
      case 'checkins': return <ClientCheckins session={session} />
      case 'alerts': return <Alerts session={session} />
      case 'mapview': return <MapView session={session} />
      case 'reports': return <Reports session={session} />
      case 'violations': return <Violations session={session} />
      case 'compliancechart': return <ComplianceChart session={session} />
      case 'clients': return <Clients session={session} />
      case 'messages': return <Messages session={session} />
      case 'contactlog': return <ContactLog session={session} />
      case 'documents': return <Documents session={session} />
      case 'tasks': return <Tasks session={session} />
      case 'programs': return <Programs session={session} />
      case 'smsalerts': return <SMSAlerts session={session} />
      case 'sops': return <SOPs session={session} />
      case 'providerguide': return <ProviderGuide session={session} />
      case 'orgsettings': return <OrgSettings session={session} />
      case 'usermanagement': return <UserManagement session={session} />
      case 'clientinvites': return <ClientInvites session={session} />
      case 'paymentplans': return <PaymentPlans session={session} />
      case 'billinghistory': return <BillingHistory session={session} />
      case 'certificates': return <CertificateOfCompletion session={session} />
      case 'settings': return <Settings session={session} />
      case 'affirmations': return <Affirmations session={session} />
      case 'assessments': return <Assessments session={session} />
      default: return <ProviderDashboard session={session} />
    }
  }

  const NavItem = ({ id, label, sub = false }) => (
    <div
      onClick={() => navTo(sub ? activeSection : id, sub ? id : null)}
      style={{
        padding: sub ? '8px 16px 8px 32px' : '10px 16px',
        fontSize: sub ? 13 : 14,
        fontWeight: currentSection === id ? 600 : 400,
        color: currentSection === id ? '#fff' : sub ? '#A8C4E0' : '#C8D8EE',
        background: currentSection === id ? 'rgba(255,255,255,0.15)' : 'transparent',
        borderRadius: 6, cursor: 'pointer', marginBottom: 2,
        borderLeft: currentSection === id ? '3px solid #fff' : '3px solid transparent',
        transition: 'all 0.15s'
      }}
    >
      {label}
    </div>
  )

  const MenuToggle = ({ menu, label }) => (
    <div
      onClick={() => toggleMenu(menu)}
      style={{ padding: '10px 16px', fontSize: 14, color: '#C8D8EE', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 10, opacity: 0.7 }}>{expandedMenus[menu] ? '▲' : '▼'}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', background: '#F5F6F8' }}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
      )}

      <div style={{ width: 220, minHeight: '100vh', background: BLUE, position: 'fixed', top: 0, left: sidebarOpen ? 0 : -220, zIndex: 50, transition: 'left 0.25s', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} className="sidebar">
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>CourtBridge Solutions</div>
          <div style={{ color: '#A8C4E0', fontSize: 11, marginTop: 2 }}>Provider Platform</div>
        </div>

        <div style={{ flex: 1, padding: '12px 8px' }}>
          <NavItem id="dashboard" label="Dashboard" />
          <NavItem id="calendar" label="Calendar" />

          <MenuToggle menu="clientCompliance" label="Client Compliance" />
          {expandedMenus.clientCompliance && (
            <>
              <NavItem id="checkins" label="Client Check-Ins" sub />
              <NavItem id="alerts" label="Alerts" sub />
              <NavItem id="mapview" label="Map View" sub />
              <NavItem id="reports" label="Reports" sub />
              <NavItem id="violations" label="Violations" sub />
              <NavItem id="compliancechart" label="Compliance Chart" sub />
            </>
          )}

          <MenuToggle menu="clients" label="Clients" />
          {expandedMenus.clients && (
            <>
              <NavItem id="clients" label="All Clients" sub />
              <NavItem id="messages" label="Messages" sub />
              <NavItem id="contactlog" label="Contact Log" sub />
              <NavItem id="documents" label="Documents" sub />
            </>
          )}

          <MenuToggle menu="operations" label="Operations" />
          {expandedMenus.operations && (
            <>
              <NavItem id="tasks" label="Tasks" sub />
              <NavItem id="programs" label="Programs" sub />
              <NavItem id="smsalerts" label="SMS Alerts" sub />
              <NavItem id="sops" label="SOPs" sub />
              <NavItem id="providerguide" label="Provider Guide" sub />
            </>
          )}

          <MenuToggle menu="admin" label="Admin" />
          {expandedMenus.admin && (
            <>
              <NavItem id="orgsettings" label="Org Settings" sub />
              <NavItem id="usermanagement" label="User Management" sub />
              <NavItem id="clientinvites" label="Client Invites" sub />
              <NavItem id="paymentplans" label="Payment Plans" sub />
              <NavItem id="billinghistory" label="Billing History" sub />
              <NavItem id="certificates" label="Certificate of Completion" sub />
            </>
          )}

          <NavItem id="settings" label="Settings" />
          <NavItem id="affirmations" label="Wellness" />

          <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ padding: '6px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coming Soon</div>
          <NavItem id="assessments" label="Phase 2 — Assessments" />
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Phase 3 — Court Portal</div>
        </div>

        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div onClick={handleLogout} style={{ padding: '10px 16px', fontSize: 13, color: '#A8C4E0', cursor: 'pointer', borderRadius: 6 }}>
            Sign Out
          </div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: BLUE, padding: 4 }}>☰</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: BLUE }}>
            {currentSection.charAt(0).toUpperCase() + currentSection.slice(1).replace(/([A-Z])/g, ' $1')}
          </div>
        </div>
        <div style={{ flex: 1, padding: 20 }}>
          {renderMain()}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .sidebar { left: 0 !important; }
          .sidebar + div { margin-left: 220px !important; }
        }
      `}</style>
    </div>
  )
}