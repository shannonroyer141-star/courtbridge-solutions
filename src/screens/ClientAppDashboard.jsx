import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DARK_BG = '#1E2A3A'
const CARD_BG = '#253347'
const SIDEBAR_BG = '#2D3748'
const BLUE = '#1B3A6B'
const ACCENT = '#5B9BF0'
const GREEN = '#4CAF7D'
const ORANGE = '#FF8C42'
const TEXT = '#ffffff'
const TEXT_MUTED = 'rgba(255,255,255,0.45)'
const TEXT_DIM = 'rgba(255,255,255,0.35)'
const BORDER = 'rgba(255,255,255,0.06)'

const POPULATION_CONFIG = {
  catch_court: {
    label: 'CATCH Court',
    checkInLabel: 'I Am Safe Today',
    safeWord: 'SUNRISE',
    affirmations: [
      'You are stronger than anything that has tried to break you.',
      'Your story is not over. The best chapters are still being written.',
      'You deserve safety, peace, and a life that is fully your own.',
      'Every day you show up is an act of courage.',
      'You are not defined by what happened to you.',
    ],
  },
  drug_court: {
    label: 'Drug Court',
    checkInLabel: 'Check In Now',
    affirmations: [
      'One day at a time. Today is enough.',
      'Recovery is not a straight line — keep going anyway.',
      'The strength it took to get here will carry you forward.',
      'You are proof that change is possible.',
      'Every meeting attended is a brick in the foundation of your new life.',
    ],
  },
  bip: {
    label: 'Accountability Program',
    checkInLabel: 'Check In Now',
    affirmations: [
      'Accountability is not punishment — it is the path to who you want to be.',
      'Change takes courage. You are showing up.',
      'The person you are becoming is worth the work.',
      'Taking responsibility is the first step to freedom.',
      'Every session completed is evidence of your commitment.',
    ],
  },
  probation: {
    label: 'Supervision Program',
    checkInLabel: 'Check In Now',
    affirmations: [
      'You are building a record that speaks for itself.',
      'Consistency today creates opportunity tomorrow.',
      'Every requirement met is a step toward full freedom.',
      'You have more going for you than against you.',
      'Stay the course. It is worth it.',
    ],
  },
  mental_health: {
    label: 'Wellness Program',
    checkInLabel: 'Check In Now',
    affirmations: [
      'Healing is not linear — and that is okay.',
      'Asking for help is one of the bravest things a person can do.',
      'You are worthy of care, rest, and peace.',
      'Small steps forward still count as progress.',
      'Your mental health matters as much as anything else in your life.',
    ],
  },
  other: {
    label: 'Community Program',
    checkInLabel: 'Check In Now',
    affirmations: [
      'You are part of something bigger than this moment.',
      'Every commitment you keep builds trust — with others and yourself.',
      'You showed up today. That matters.',
      'Progress is happening even when it feels slow.',
      'You are writing a new story.',
    ],
  },
}

function StreakRing({ streak }) {
  const max = 30
  const pct = Math.min(streak / max, 1)
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={ACCENT} strokeWidth="7"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: TEXT, lineHeight: 1 }}>{streak}</div>
        <div style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 2, letterSpacing: '0.5px', textTransform: 'uppercase' }}>streak</div>
      </div>
    </div>
  )
}

function SidebarItem({ icon, label, active, badge, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px',
      fontSize: 13, color: active ? TEXT : 'rgba(255,255,255,0.55)',
      background: active ? 'rgba(91,155,240,0.12)' : 'transparent',
      borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
      cursor: 'pointer',
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ background: ORANGE, color: TEXT, fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 20 }}>{badge}</span>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, valueColor = ACCENT }) {
  return (
    <div style={{ background: CARD_BG, borderRadius: 8, padding: '12px 14px', border: `0.5px solid ${BORDER}`, flex: 1 }}>
      <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 500, color: valueColor, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function InnerCard({ children, style = {} }) {
  return (
    <div style={{ background: CARD_BG, borderRadius: 8, padding: '13px 14px', border: `0.5px solid ${BORDER}`, ...style }}>
      {children}
    </div>
  )
}

function ListRow({ icon, iconBg, iconColor, title, meta, badgeText, badgeColor, badgeBg, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: last ? 'none' : `0.5px solid rgba(255,255,255,0.05)` }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, fontSize: 13, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: TEXT }}>{title}</div>
        {meta && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 1 }}>{meta}</div>}
      </div>
      {badgeText && (
        <div style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, background: badgeBg, color: badgeColor, whiteSpace: 'nowrap' }}>{badgeText}</div>
      )}
    </div>
  )
}

export default function ClientAppDashboard({ session, clientName = 'there', onNavigate, onLogout }) {
  const [client, setClient] = useState(null)
  const [checkIns, setCheckIns] = useState([])
  const [courtDates, setCourtDates] = useState([])
  const [tasks, setTasks] = useState([])
  const [affirmationIndex, setAffirmationIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInMsg, setCheckInMsg] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    fetchClientData()
    setAffirmationIndex(Math.floor(Date.now() / 86400000) % 5)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  async function fetchClientData() {
    setLoading(true)
    const userId = session?.user?.id
    if (!userId) { setLoading(false); return }

    // Try to find client by auth_user_id first, then by email
    let clientData = null
    const { data: byUserId } = await supabase
      .from('clients')
      .select('*')
      .eq('auth_user_id', userId)
      .single()

    if (byUserId) {
      clientData = byUserId
    } else {
      const { data: byEmail } = await supabase
        .from('clients')
        .select('*')
        .eq('email', session.user.email)
        .single()
      if (byEmail) clientData = byEmail
    }

    if (clientData) {
      setClient(clientData)
      setIsFirstTime(!clientData.onboarding_complete)
    } else {
      setIsFirstTime(true)
    }

    const { data: ci } = await supabase
      .from('check_ins')
      .select('*')
      .eq('client_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(10)
    if (ci) setCheckIns(ci)

    const { data: cd } = await supabase
      .from('court_dates')
      .select('*')
      .eq('client_id', userId)
      .gte('hearing_date', new Date().toISOString().split('T')[0])
      .order('hearing_date')
      .limit(5)
    if (cd) setCourtDates(cd)

    const { data: tk } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', userId)
      .eq('completed', false)
      .order('due_date')
      .limit(5)
    if (tk) setTasks(tk)

    setLoading(false)
  }

  async function handleCheckIn() {
    if (checkedInToday) return
    setCheckingIn(true)
    setCheckInMsg(null)
    try {
      const userId = session?.user?.id
      const now = new Date().toISOString()
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude, longitude } = pos.coords
      const { error } = await supabase.from('check_ins').insert({
        client_id: userId,
        provider_id: client?.provider_id,
        checked_in_at: now,
        latitude,
        longitude,
        gps_accuracy_meters: Math.round(pos.coords.accuracy),
        notes: null,
      })
      if (error) throw error
      setCheckInMsg({ type: 'success', text: 'Check-in complete! Location recorded.' })
      fetchClientData()
    } catch (err) {
      if (err.code === 1) setCheckInMsg({ type: 'error', text: 'Location access denied. Please enable GPS.' })
      else if (err.code === 2) setCheckInMsg({ type: 'error', text: 'Could not get your location. Please try again.' })
      else if (err.code === 3) setCheckInMsg({ type: 'error', text: 'Location request timed out. Please try again.' })
      else setCheckInMsg({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setCheckingIn(false)
    }
  }

  const pop = (client?.population_type && POPULATION_CONFIG[client.population_type])
    ? POPULATION_CONFIG[client.population_type]
    : POPULATION_CONFIG.other

  const isCatch = client?.population_type === 'catch_court'

  const displayName = client?.name || session?.user?.email || 'there'
  const firstName = displayName.split(' ')[0]

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const affirmation = pop.affirmations[affirmationIndex % pop.affirmations.length]
  const checkedInToday = checkIns.some(c => new Date(c.checked_in_at).toDateString() === new Date().toDateString())
  const streak = checkIns.reduce((acc, ci, i, arr) => {
    if (i === 0) return 1
    const diff = (new Date(arr[i - 1].checked_in_at) - new Date(ci.checked_in_at)) / 86400000
    return diff <= 1.5 ? acc + 1 : acc
  }, checkIns.length > 0 ? 1 : 0)
  const complianceRate = checkIns.length > 0 ? Math.round((streak / Math.max(checkIns.length, 1)) * 100) : 0
  const enrollDate = client?.enrollment_date || client?.created_at
  const daysEnrolled = enrollDate ? Math.max(1, Math.floor((Date.now() - new Date(enrollDate)) / 86400000)) : 1
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const nextCourtDate = courtDates[0]
  const nextTask = tasks[0]
  const nextApptDate = nextCourtDate?.hearing_date || nextTask?.due_date || null
  const nextApptLabel = nextApptDate
    ? (() => {
        const d = new Date(nextApptDate)
        const diff = Math.ceil((d - new Date()) / 86400000)
        if (diff === 0) return 'Today'
        if (diff === 1) return 'Tomorrow'
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })()
    : null
  const nextApptSub = nextCourtDate
    ? (nextCourtDate.court_name || 'Court appearance')
    : nextTask
    ? (nextTask.title || 'Provider task')
    : 'None scheduled'

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: DARK_BG }}>
      <div style={{ color: TEXT_MUTED, fontSize: 14 }}>Loading your dashboard...</div>
    </div>
  )

  if (isFirstTime) return <FirstTimeWelcome name={firstName} onDone={() => setIsFirstTime(false)} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: DARK_BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* SIDEBAR — desktop only */}
      {!isMobile && <div style={{ width: 200, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: '100vh' }}>
        <div style={{ padding: '22px 18px 18px', borderBottom: `0.5px solid rgba(255,255,255,0.08)` }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>CourtBridge Solutions</div>
          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>My portal</div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', padding: '14px 18px 5px' }}>My progress</div>
        <SidebarItem icon="⊞" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <SidebarItem icon="📋" label="My history" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <SidebarItem icon="📍" label="Check In" active={activeTab === 'checkin'} onClick={() => onNavigate && onNavigate('checkin')} />

        <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', padding: '14px 18px 5px' }}>My case</div>
        <SidebarItem icon="📄" label="My documents" active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
        <SidebarItem icon="💬" label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
        <SidebarItem icon="📅" label="Court dates" active={activeTab === 'courtdates'} onClick={() => setActiveTab('courtdates')} />

        <div style={{ marginTop: 'auto', padding: '14px 18px', borderTop: `0.5px solid rgba(255,255,255,0.08)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: TEXT, flexShrink: 0 }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, color: TEXT }}>{firstName}</div>
              <div style={{ fontSize: 10, color: TEXT_MUTED }}>{pop.label}</div>
            </div>
          </div>
          <div onClick={onLogout} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', paddingTop: 4 }}>Sign out</div>
        </div>
      </div>}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 500, color: TEXT }}>{getGreeting()}, {firstName}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3 }}>{today} · Day {daysEnrolled} of your program</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: CARD_BG, border: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: TEXT_MUTED }}>🔔</div>
        </div>

        {/* Hero check-in */}
        <div style={{ margin: '16px 22px 0', background: BLUE, borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 20, border: `0.5px solid rgba(91,155,240,0.2)` }}>
          <StreakRing streak={streak} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>
              {checkedInToday ? `You checked in today — ${streak} day streak!` : `You are on a ${streak}-day check-in streak`}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.5 }}>
              {nextApptDate
                ? `Your next appointment is ${nextApptLabel} — ${nextApptSub}.`
                : 'Keep up the great work. Consistency is your proof.'}
            </div>
            {checkInMsg && (
              <div style={{ marginTop: 8, fontSize: 12, color: checkInMsg.type === 'success' ? GREEN : ORANGE }}>
                {checkInMsg.text}
              </div>
            )}
            <div
              onClick={handleCheckIn}
              style={{
                marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                background: checkedInToday ? 'rgba(76,175,125,0.2)' : 'rgba(255,255,255,0.15)',
                border: `0.5px solid ${checkedInToday ? 'rgba(76,175,125,0.4)' : 'rgba(255,255,255,0.25)'}`,
                color: TEXT, fontSize: 12, padding: '7px 14px', borderRadius: 8,
                cursor: checkedInToday || checkingIn ? 'default' : 'pointer',
                opacity: checkingIn ? 0.7 : 1,
              }}
            >
              {checkingIn ? 'Getting your location...' : checkedInToday ? '✓ Checked in today' : `${pop.checkInLabel} 📍`}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px 0' }}>
          <StatCard label="Compliance rate" value={`${complianceRate}%`} sub="All time" valueColor={GREEN} />
          <StatCard label="Check-ins this month" value={checkIns.length} sub={checkedInToday ? 'Including today' : 'Not yet today'} valueColor={ACCENT} />
          <StatCard label="Next appointment" value={nextApptLabel || '—'} sub={nextApptSub} valueColor={nextApptDate ? ORANGE : TEXT_MUTED} />
        </div>

        {/* Affirmation */}
        <div style={{ margin: '14px 22px 0', background: CARD_BG, borderRadius: 8, padding: '13px 14px', border: `0.5px solid rgba(91,155,240,0.15)` }}>
          <div style={{ fontSize: 10, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>✦ Today's affirmation</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, fontStyle: 'italic' }}>"{affirmation}"</div>
        </div>

        {/* Safety word — CATCH only */}
        {isCatch && (
          <div style={{ margin: '10px 22px 0', background: 'rgba(255,140,66,0.08)', borderRadius: 8, padding: '13px 14px', border: `0.5px solid rgba(255,140,66,0.25)` }}>
            <div style={{ fontSize: 10, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Safety word</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              If you are not safe, type <strong style={{ color: ORANGE }}>SUNRISE</strong> in your check-in notes. Your advocate will be notified privately.
            </div>
          </div>
        )}

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: `14px 22px ${isMobile ? 80 : 20}px` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>Important dates & tasks</div>
            <InnerCard>
              {courtDates.length === 0 && tasks.length === 0 && (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>Nothing upcoming right now</div>
              )}
              {courtDates.slice(0, 3).map((cd, i) => (
                <ListRow
                  key={cd.id}
                  icon="⚖️"
                  iconBg="rgba(200,80,0,0.12)"
                  iconColor={ORANGE}
                  title={cd.hearing_type || 'Court appearance'}
                  meta={`${new Date(cd.hearing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${cd.court_name || 'Location TBD'}`}
                  badgeText={i === 0 ? nextApptLabel : new Date(cd.hearing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  badgeColor={ORANGE}
                  badgeBg="rgba(200,80,0,0.2)"
                  last={i === courtDates.slice(0, 3).length - 1 && tasks.length === 0}
                />
              ))}
              {tasks.slice(0, 3).map((t, i) => (
                <ListRow
                  key={t.id}
                  icon="📋"
                  iconBg="rgba(91,155,240,0.12)"
                  iconColor={ACCENT}
                  title={t.title}
                  meta={t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Assigned by your provider'}
                  badgeText="Task"
                  badgeColor={ACCENT}
                  badgeBg="rgba(91,155,240,0.15)"
                  last={i === tasks.slice(0, 3).length - 1}
                />
              ))}
            </InnerCard>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>Recent check-ins</div>
            <InnerCard>
              {checkIns.length > 0 ? checkIns.slice(0, 3).map((ci, i) => (
                <ListRow
                  key={ci.id}
                  icon="✓"
                  iconBg="rgba(76,175,125,0.12)"
                  iconColor={GREEN}
                  title={new Date(ci.checked_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + new Date(ci.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  meta={ci.location_name || (ci.latitude ? 'GPS verified' : 'Location recorded')}
                  badgeText={isCatch ? 'Safe' : 'On time'}
                  badgeColor={GREEN}
                  badgeBg="rgba(76,175,125,0.15)"
                  last={i === checkIns.slice(0, 3).length - 1}
                />
              )) : (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '8px 0' }}>No check-ins yet — complete your first one today</div>
              )}
            </InnerCard>
          </div>
        </div>
      </div>

      {/* BOTTOM NAV — mobile only */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 62,
          background: SIDEBAR_BG, borderTop: `0.5px solid rgba(255,255,255,0.08)`,
          display: 'flex', alignItems: 'stretch', zIndex: 100,
        }}>
          {[
            { id: 'dashboard', icon: '⊞', label: 'Home' },
            { id: 'checkin',   icon: '📍', label: 'Check In' },
            { id: 'courtdates', icon: '📅', label: 'Calendar' },
            { id: 'profile',   icon: '👤', label: 'Profile' },
          ].map(({ id, icon, label }) => {
            const active = activeTab === id
            const handleTap = () => {
              if (id === 'checkin') { onNavigate && onNavigate('checkin') }
              else setActiveTab(id)
            }
            return (
              <div key={id} onClick={handleTap} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 3, cursor: 'pointer',
                color: active ? ACCENT : 'rgba(255,255,255,0.4)',
                borderTop: active ? `2px solid ${ACCENT}` : '2px solid transparent',
              }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: active ? 500 : 400 }}>{label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FirstTimeWelcome({ name, onDone }) {
  const [step, setStep] = useState(0)
  const steps = [
    {
      title: `Welcome to CourtBridge Solutions, ${name}`,
      body: `This is your personal portal for staying on track with your program — check-ins, court dates, tasks, and more in one place.`,
      cta: 'Get Started'
    },
    {
      title: 'Daily Check-Ins',
      body: `Your program requires regular check-ins. Use the sidebar to tap Check In — your location is captured and recorded automatically.`,
      cta: 'Next'
    },
    {
      title: 'Your Schedule',
      body: `Important dates, upcoming appointments, and tasks assigned by your provider will appear right on your dashboard so nothing slips through the cracks.`,
      cta: 'Next'
    },
    {
      title: 'Your record speaks for itself',
      body: `Every check-in you complete is timestamped, GPS-verified, and saved. When it matters most — in court, with your officer, with your provider — your compliance is already documented.`,
      cta: 'Go to My Dashboard'
    },
  ]
  const current = steps[step]
  const isLast = step === steps.length - 1
  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: TEXT, marginBottom: 4 }}>CourtBridge Solutions</div>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 40 }}>My portal</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? ACCENT : 'rgba(255,255,255,0.2)', transition: 'all 0.3s ease' }} />
        ))}
      </div>
      <div style={{ background: CARD_BG, borderRadius: 16, padding: '36px 32px', maxWidth: 380, width: '100%', textAlign: 'center', border: `0.5px solid ${BORDER}` }}>
        <div style={{ color: TEXT, fontSize: 20, fontWeight: 500, marginBottom: 16, lineHeight: 1.3 }}>{current.title}</div>
        <div style={{ color: TEXT_MUTED, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>{current.body}</div>
        <button onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          style={{ width: '100%', padding: '13px', background: BLUE, color: TEXT, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          {current.cta}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ marginTop: 12, background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer' }}>
            Back
          </button>
        )}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 28 }}>CourtBridge Solutions · Turning participation into proof</div>
    </div>
  )
}