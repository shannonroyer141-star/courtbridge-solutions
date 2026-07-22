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

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '⊞', label: 'Home' },
  { id: 'checkin',    icon: '📍', label: 'Check In' },
  { id: 'journey',    icon: '🏅', label: 'My Journey' },
  { id: 'documents',  icon: '📄', label: 'My Documents' },
  { id: 'forms',      icon: '✍️', label: 'Forms to Sign' },
  { id: 'messages',   icon: '💬', label: 'Messages' },
  { id: 'courtdates', icon: '📅', label: 'Court Dates' },
  { id: 'settings',   icon: '📊', label: 'My Progress' },
]

function NavItem({ icon, label, active, showLabels, hovered, onHover, onLeave, onClick }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center',
        justifyContent: showLabels ? 'flex-start' : 'center',
        gap: showLabels ? 12 : 0,
        padding: showLabels ? '11px 16px' : '11px 0',
        cursor: 'pointer',
        background: active ? BLUE : hovered && !active ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
        color: active ? TEXT : hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
        transition: 'background 0.15s, color 0.15s',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0, width: 22, textAlign: 'center' }}>{icon}</span>
      {showLabels && <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{label}</span>}
      {!showLabels && hovered && (
        <div style={{
          position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
          marginLeft: 10, background: BLUE, color: TEXT, fontSize: 12, fontWeight: 500,
          padding: '5px 10px', borderRadius: 6, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 300, boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}>{label}</div>
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
  const [clientPrograms, setClientPrograms] = useState([])
  const [milestones, setMilestones] = useState([])
  const [progressNotes, setProgressNotes] = useState([])
  const [courtDates, setCourtDates] = useState([])
  const [tasks, setTasks] = useState([])
  const [documents, setDocuments] = useState([])
  const [formTemplates, setFormTemplates] = useState([])
  const [mySignatures, setMySignatures] = useState([])
  const [signingTemplate, setSigningTemplate] = useState(null)
  const [signatureName, setSignatureName] = useState('')
  const [signing, setSigning] = useState(false)
  const [affirmationIndex, setAffirmationIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInMsg, setCheckInMsg] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [threadMessages, setThreadMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [composeText, setComposeText] = useState('')
  const [composeUrgent, setComposeUrgent] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageStatus, setMessageStatus] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [hoveredNavItem, setHoveredNavItem] = useState(null)

  useEffect(() => {
    fetchClientData()
    setAffirmationIndex(Math.floor(Date.now() / 86400000) % 5)
  }, [])

  useEffect(() => {
    if (activeTab === 'messages' && client?.id) fetchMessages()
  }, [activeTab, client?.id])

  async function fetchMessages() {
    setMessagesLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: true })
    setThreadMessages(data || [])
    setMessagesLoading(false)
  }

  async function sendClientMessage() {
    if (!composeText.trim() || !client?.id) return
    setSendingMessage(true)
    setMessageStatus(null)
    try {
      const { error } = await supabase.from('messages').insert({
        client_id: client.id,
        provider_id: client.provider_id,
        sender_role: 'client',
        is_urgent: composeUrgent,
        subject: composeUrgent ? 'Urgent message from participant' : 'Message from participant',
        body: composeText.trim(),
        message_type: 'client_message',
        delivered: true,
      })
      if (error) throw error

      if (composeUrgent) {
        const { data: providerProfile } = await supabase
          .from('profiles').select('phone').eq('id', client.provider_id).single()
        if (providerProfile?.phone) {
          const { data: { session: authSession } } = await supabase.auth.getSession()
          fetch(`https://howvgvrrxcpdiqjbnhzn.supabase.co/functions/v1/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession.access_token}` },
            body: JSON.stringify({
              to_phone: providerProfile.phone,
              body: `URGENT message from ${client.name} in CourtBridge: ${composeText.trim()}`,
              client_id: client.id,
            }),
          }).catch(() => {})
        }
      }

      setComposeText('')
      setComposeUrgent(false)
      setMessageStatus({ type: 'success', text: 'Message sent to your provider.' })
      fetchMessages()
    } catch (err) {
      setMessageStatus({ type: 'error', text: 'Could not send message. Please try again.' })
    } finally {
      setSendingMessage(false)
    }
  }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  async function fetchClientData() {
    setLoading(true)
    const userId = session?.user?.id
    const userEmail = session?.user?.email
    if (!userId) { setLoading(false); return }

    const { data: rows } = await supabase
      .from('clients')
      .select('*')
      .or(`auth_user_id.eq.${userId},email.eq.${userEmail}`)
      .limit(1)

    const clientData = rows?.[0] || null

    if (clientData) {
      setClient(clientData)
      setIsFirstTime(!clientData.onboarding_complete)
    } else {
      setIsFirstTime(true)
      setLoading(false)
      return
    }

    const { data: ci } = await supabase
      .from('checkins')
      .select('*')
      .eq('client_id', clientData.id)
      .order('checked_in_at', { ascending: false })
      .limit(400)
    if (ci) setCheckIns(ci)

    const { data: programs } = await supabase
      .from('client_programs')
      .select('*')
      .eq('client_id', clientData.id)
      .order('created_at')
    if (programs) setClientPrograms(programs)

    const { data: notes } = await supabase
      .from('client_progress_notes')
      .select('*')
      .eq('client_id', clientData.id)
      .order('note_date', { ascending: false })
    setProgressNotes(notes || [])

    const { data: existingMilestones } = await supabase
      .from('client_milestones')
      .select('*')
      .eq('client_id', clientData.id)
      .order('achieved_at', { ascending: false })
    setMilestones(existingMilestones || [])

    const currentStreak = (ci || []).reduce((acc, row, i, arr) => {
      if (i === 0) return 1
      const diff = (new Date(arr[i - 1].checked_in_at) - new Date(row.checked_in_at)) / 86400000
      return diff <= 1.5 ? acc + 1 : acc
    }, (ci || []).length > 0 ? 1 : 0)

    const STREAK_MILESTONES = [
      { days: 7, type: 'checkin_streak_7', title: '7-Day Check-In Streak' },
      { days: 30, type: 'checkin_streak_30', title: '30-Day Check-In Streak' },
      { days: 90, type: 'checkin_streak_90', title: '90-Day Check-In Streak' },
      { days: 180, type: 'checkin_streak_180', title: '180-Day Check-In Streak' },
      { days: 365, type: 'checkin_streak_365', title: '1-Year Check-In Streak' },
    ]
    const alreadyEarned = new Set((existingMilestones || []).map(m => m.milestone_type))
    const newlyEarned = STREAK_MILESTONES.filter(m => currentStreak >= m.days && !alreadyEarned.has(m.type))
    if (newlyEarned.length > 0) {
      const rows = newlyEarned.map(m => ({
        client_id: clientData.id,
        milestone_type: m.type,
        title: m.title,
        description: `Reached a ${m.days}-day consecutive check-in streak.`,
      }))
      const { data: inserted } = await supabase.from('client_milestones').insert(rows).select()
      if (inserted) setMilestones(prev => [...inserted, ...prev])
    }

    const { data: cd } = await supabase
      .from('court_dates')
      .select('*')
      .eq('client_id', clientData.id)
      .gte('hearing_date', new Date().toISOString().split('T')[0])
      .order('hearing_date')
      .limit(5)
    if (cd) setCourtDates(cd)

    const { data: tk } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', clientData.id)
      .eq('completed', false)
      .order('due_date')
      .limit(5)
    if (tk) setTasks(tk)

    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientData.id)
      .order('uploaded_at', { ascending: false })
    if (docs) setDocuments(docs)

    const { data: templates } = await supabase
      .from('form_templates')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (templates) setFormTemplates(templates)

    const { data: sigs } = await supabase
      .from('form_signatures')
      .select('*')
      .eq('client_id', clientData.id)
      .order('signed_at', { ascending: false })
    setMySignatures(sigs || [])

    setLoading(false)
  }

  async function signForm() {
    if (!signingTemplate || !signatureName.trim() || !client?.id) return
    setSigning(true)
    await supabase.from('form_signatures').insert({
      client_id: client.id,
      form_template_id: signingTemplate.id,
      form_title: signingTemplate.title,
      form_content_snapshot: signingTemplate.content,
      signature_name: signatureName.trim(),
    })
    setSigning(false)
    setSigningTemplate(null)
    setSignatureName('')
    fetchClientData()
  }

  function openSignatureSlip(sig) {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Signed Form - ${sig.form_title}</title>
      <style>
        body { font-family: Georgia, serif; padding: 50px; max-width: 650px; margin: 0 auto; color: #1a1a2e; }
        .header { border-bottom: 2px solid #1B3A6B; padding-bottom: 16px; margin-bottom: 24px; }
        h1 { color: #1B3A6B; font-size: 20px; margin: 0 0 4px; }
        .meta { color: #666; font-size: 13px; }
        .content { font-size: 14px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 30px; }
        .sig-block { border-top: 1px solid #ccc; padding-top: 14px; font-size: 13px; color: #444; }
      </style>
      </head><body>
        <div class="header">
          <h1>CourtBridge Solutions — Signed Form</h1>
          <div class="meta">${sig.form_title}</div>
        </div>
        <div class="content">${sig.form_content_snapshot}</div>
        <div class="sig-block">
          <div>Electronically signed by: <strong>${sig.signature_name}</strong></div>
          <div>Signed on: ${new Date(sig.signed_at).toLocaleString()}</div>
        </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  function compactDate(dateStr) {
    return dateStr.replaceAll('-', '')
  }

  function openNotePdf(note) {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Progress Note - ${compactDate(note.note_date)}</title>
      <style>
        body { font-family: Georgia, serif; padding: 50px; max-width: 650px; margin: 0 auto; color: #1a1a2e; }
        .header { border-bottom: 2px solid #1B3A6B; padding-bottom: 16px; margin-bottom: 24px; }
        h1 { color: #1B3A6B; font-size: 20px; margin: 0 0 4px; }
        .date { color: #666; font-size: 13px; }
        .content { font-size: 15px; line-height: 1.8; white-space: pre-wrap; }
        .footer { margin-top: 40px; font-size: 11px; color: #999; }
      </style>
      </head><body>
        <div class="header">
          <h1>CourtBridge Solutions — Progress Note</h1>
          <div class="date">${new Date(note.note_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div class="content">${note.content}</div>
        <div class="footer">Generated ${new Date().toLocaleString()}</div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  async function viewDocument(doc) {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_url, 300)
    if (error || !data?.signedUrl) return
    window.open(data.signedUrl, '_blank')
  }

  async function handleCheckIn() {
    if (checkedInToday) return
    if (!client?.id) { setCheckInMsg({ type: 'error', text: 'Client record not found. Please contact your provider.' }); return }
    setCheckingIn(true)
    setCheckInMsg(null)
    try {
      const now = new Date().toISOString()
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude, longitude } = pos.coords
      const { error } = await supabase.from('checkins').insert({
        client_id: client.id,
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

  const emailPrefix = session?.user?.email?.split('@')[0] || 'there'
  const displayName = client?.name || emailPrefix
  const firstName = displayName.split(' ')[0]

  function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  function toggleSidebar() {
    if (sidebarExpanded) {
      setShowLabels(false)
      setSidebarExpanded(false)
    } else {
      setSidebarExpanded(true)
      setTimeout(() => setShowLabels(true), 220)
    }
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
  const daysEnrolled = enrollDate ? Math.floor((Date.now() - new Date(enrollDate)) / 86400000) + 1 : 1
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

  const weekNumber = Math.max(Math.ceil(daysEnrolled / 7), 1)
  const primaryProgram = clientPrograms.find(p => p.order_type === 'primary' && p.status === 'active') || clientPrograms.find(p => p.status === 'active')
  const primaryWeeksIn = primaryProgram ? Math.max(Math.floor((Date.now() - new Date(primaryProgram.start_date)) / (7 * 86400000)), 0) : null
  const primaryPct = primaryProgram?.duration_weeks ? Math.min(Math.round((primaryWeeksIn / primaryProgram.duration_weeks) * 100), 100) : null
  const tasksBeforeVisit = nextCourtDate
    ? tasks.filter(t => new Date(t.due_date) <= new Date(nextCourtDate.hearing_date))
    : tasks

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: DARK_BG }}>
      <div style={{ color: TEXT_MUTED, fontSize: 14 }}>Loading your dashboard...</div>
    </div>
  )

  if (isFirstTime) return <FirstTimeWelcome name={firstName} onDone={() => setIsFirstTime(false)} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: DARK_BG, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* SIDEBAR — desktop only */}
      {!isMobile && (
        <div style={{
          width: sidebarExpanded ? 200 : 56,
          background: DARK_BG,
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          minHeight: '100vh', overflow: 'visible', position: 'relative',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          borderRight: `0.5px solid rgba(255,255,255,0.08)`,
          zIndex: 10,
        }}>
          {/* Toggle button */}
          <div style={{
            height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, borderBottom: `0.5px solid rgba(255,255,255,0.06)`,
          }}>
            <div
              onClick={toggleSidebar}
              style={{
                cursor: 'pointer', color: TEXT_MUTED, fontSize: 15, lineHeight: 1,
                padding: '6px 8px', borderRadius: 6, userSelect: 'none',
                transition: 'color 0.15s',
              }}
            >
              {sidebarExpanded ? '✕' : '☰'}
            </div>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, paddingTop: 6 }}>
            {NAV_ITEMS.map(item => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                showLabels={showLabels}
                hovered={hoveredNavItem === item.id}
                onHover={() => setHoveredNavItem(item.id)}
                onLeave={() => setHoveredNavItem(null)}
                onClick={() => item.id === 'checkin'
                  ? (onNavigate && onNavigate('checkin'))
                  : setActiveTab(item.id)
                }
              />
            ))}
          </div>

          {/* User footer */}
          <div style={{
            borderTop: `0.5px solid rgba(255,255,255,0.06)`,
            padding: '14px 0',
            display: 'flex', alignItems: 'center',
            justifyContent: showLabels ? 'flex-start' : 'center',
            paddingLeft: showLabels ? 14 : 0,
            gap: 10, flexShrink: 0,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', background: BLUE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: TEXT, flexShrink: 0,
            }}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            {showLabels && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: TEXT, whiteSpace: 'nowrap' }}>{firstName}</div>
                <div onClick={onLogout} style={{ fontSize: 11, color: TEXT_MUTED, cursor: 'pointer', marginTop: 2 }}>Sign out</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 500, color: TEXT }}>{getGreeting()}, {firstName}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3 }}>{today} · Day {daysEnrolled} of your program</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: CARD_BG, border: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: TEXT_MUTED }}>🔔</div>
        </div>

        {activeTab === 'documents' && (
          <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>My Documents</div>
            <InnerCard>
              {documents.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>No documents shared with you yet.</div>
              ) : (
                documents.map((d, i) => (
                  <div key={d.id} onClick={() => viewDocument(d)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    padding: '10px 0', borderBottom: i === documents.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)`,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: TEXT }}>{d.file_name}</div>
                      <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>
                        {d.document_type} · {new Date(d.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>View →</div>
                  </div>
                ))
              )}
            </InnerCard>
          </div>
        )}

        {activeTab === 'forms' && (() => {
          const signedIds = new Set(mySignatures.map(s => s.form_template_id))
          const pendingTemplates = formTemplates.filter(t => !signedIds.has(t.id))
          return (
            <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>Needs Your Signature</div>
              <InnerCard style={{ marginBottom: 16 }}>
                {pendingTemplates.length === 0 ? (
                  <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>Nothing waiting on you right now.</div>
                ) : (
                  pendingTemplates.map((t, i) => (
                    <div key={t.id} style={{ padding: '10px 0', borderBottom: i === pendingTemplates.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, color: TEXT }}>{t.title}</div>
                          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{t.form_type}</div>
                        </div>
                        <div onClick={() => { setSigningTemplate(signingTemplate?.id === t.id ? null : t); setSignatureName('') }}
                          style={{ fontSize: 11, color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>
                          {signingTemplate?.id === t.id ? 'Cancel' : 'Read & Sign →'}
                        </div>
                      </div>
                      {signingTemplate?.id === t.id && (
                        <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                            {t.content}
                          </div>
                          <input
                            placeholder="Type your full name to sign"
                            value={signatureName}
                            onChange={e => setSignatureName(e.target.value)}
                            style={{ width: '100%', boxSizing: 'border-box', background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: TEXT, marginBottom: 8 }}
                          />
                          <div
                            onClick={!signing && signatureName.trim() ? signForm : undefined}
                            style={{
                              display: 'inline-block', background: signatureName.trim() ? BLUE : 'rgba(255,255,255,0.1)', color: TEXT,
                              fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 8,
                              cursor: signatureName.trim() ? 'pointer' : 'default', opacity: signing ? 0.7 : 1,
                            }}
                          >
                            {signing ? 'Signing...' : 'Sign & Submit'}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </InnerCard>

              <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>Signed Forms</div>
              <InnerCard>
                {mySignatures.length === 0 ? (
                  <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>Nothing signed yet.</div>
                ) : (
                  mySignatures.map((s, i) => (
                    <div key={s.id} onClick={() => openSignatureSlip(s)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                      padding: '10px 0', borderBottom: i === mySignatures.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)`,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: TEXT }}>{s.form_title}</div>
                        <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>Signed {new Date(s.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                      <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>View / Save PDF →</div>
                    </div>
                  ))
                )}
              </InnerCard>
            </div>
          )
        })()}

        {activeTab === 'settings' && (
          <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
            <div style={{ background: BLUE, borderRadius: 12, padding: '18px 20px', border: `0.5px solid rgba(91,155,240,0.2)`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {primaryProgram ? primaryProgram.order_name : 'Your program'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: TEXT, marginTop: 4 }}>
                Week {primaryProgram?.duration_weeks ? Math.min(primaryWeeksIn + 1, primaryProgram.duration_weeks) : weekNumber}
                {primaryProgram?.duration_weeks ? ` of ${primaryProgram.duration_weeks}` : ''}
              </div>
              {primaryPct !== null && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${primaryPct}%`, background: ACCENT, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{primaryPct}% of the way through</div>
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>
              {nextCourtDate ? `Before Your Next Visit (${nextApptLabel})` : 'Your Tasks'}
            </div>
            <InnerCard>
              {tasksBeforeVisit.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>
                  {nextCourtDate ? 'Nothing due before your next visit — you\'re all caught up.' : 'No tasks assigned right now.'}
                </div>
              ) : (
                tasksBeforeVisit.map((t, i) => (
                  <ListRow
                    key={t.id}
                    icon="✓" iconBg="rgba(91,155,240,0.15)" iconColor={ACCENT}
                    title={t.title}
                    meta={t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : null}
                    last={i === tasksBeforeVisit.length - 1}
                  />
                ))
              )}
            </InnerCard>
          </div>
        )}

        {activeTab === 'journey' && (
          <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>My Programs</div>
            <InnerCard style={{ marginBottom: 16 }}>
              {clientPrograms.length === 0 && (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>Your provider hasn't added a program to track here yet.</div>
              )}
              {clientPrograms.map((p, i) => {
                const weeksIn = Math.floor((Date.now() - new Date(p.start_date)) / (7 * 86400000))
                const pct = p.duration_weeks ? Math.min(Math.round((weeksIn / p.duration_weeks) * 100), 100) : null
                const isDone = p.status === 'completed'
                return (
                  <div key={p.id} style={{ padding: '10px 0', borderBottom: i === clientPrograms.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, color: TEXT }}>{p.order_name}</div>
                      <div style={{
                        fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                        background: isDone ? 'rgba(76,175,125,0.15)' : p.status === 'terminated' ? 'rgba(248,113,113,0.15)' : 'rgba(91,155,240,0.15)',
                        color: isDone ? GREEN : p.status === 'terminated' ? '#F87171' : ACCENT,
                      }}>
                        {isDone ? '🎉 Completed' : p.status === 'terminated' ? 'Ended' : 'In progress'}
                      </div>
                    </div>
                    {pct !== null && !isDone && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>Week {Math.max(weeksIn, 0)} of {p.duration_weeks}</div>
                      </div>
                    )}
                    {isDone && p.completed_at && (
                      <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>Completed {new Date(p.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    )}
                  </div>
                )
              })}
            </InnerCard>

            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>My Achievements</div>
            <InnerCard>
              {milestones.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>Keep checking in — your first achievement badge is on the way.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {milestones.map(m => (
                    <div key={m.id} style={{ background: 'rgba(91,155,240,0.08)', border: `0.5px solid rgba(91,155,240,0.2)`, borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22 }}>🏅</div>
                      <div style={{ fontSize: 11, color: TEXT, fontWeight: 500, marginTop: 6 }}>{m.title}</div>
                      <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 3 }}>{new Date(m.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  ))}
                </div>
              )}
            </InnerCard>

            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, margin: '16px 0 10px' }}>Progress Notes</div>
            <InnerCard>
              {progressNotes.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>Your provider hasn't shared any session notes yet.</div>
              ) : (
                progressNotes.map((n, i) => (
                  <div key={n.id} onClick={() => openNotePdf(n)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                    padding: '10px 0', borderBottom: i === progressNotes.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)`,
                  }}>
                    <div style={{ fontSize: 13, color: TEXT, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.5px' }}>{compactDate(n.note_date)}</div>
                    <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>View / Save PDF →</div>
                  </div>
                ))
              )}
            </InnerCard>
          </div>
        )}

        {activeTab === 'messages' && (
          <div style={{ margin: '16px 22px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
              {messagesLoading && <div style={{ fontSize: 13, color: TEXT_MUTED }}>Loading messages...</div>}
              {!messagesLoading && threadMessages.length === 0 && (
                <div style={{ fontSize: 13, color: TEXT_DIM, padding: '20px 0' }}>No messages yet. Send your provider a message below.</div>
              )}
              {threadMessages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.sender_role === 'client' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: m.sender_role === 'client' ? BLUE : CARD_BG,
                  border: m.is_urgent ? `1px solid ${ORANGE}` : `0.5px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                }}>
                  {m.is_urgent && <div style={{ fontSize: 10, fontWeight: 700, color: ORANGE, textTransform: 'uppercase', marginBottom: 4 }}>Urgent</div>}
                  <div style={{ fontSize: 13, color: TEXT, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                  <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 6 }}>{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 12 }}>
              <textarea
                value={composeText}
                onChange={e => setComposeText(e.target.value)}
                placeholder="Message your provider..."
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: TEXT, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: composeUrgent ? ORANGE : TEXT_MUTED, cursor: 'pointer' }}>
                  <input type="checkbox" checked={composeUrgent} onChange={e => setComposeUrgent(e.target.checked)} />
                  Mark urgent — notifies your provider immediately
                </label>
                <div
                  onClick={!sendingMessage && composeText.trim() ? sendClientMessage : undefined}
                  style={{ background: composeText.trim() ? BLUE : 'rgba(255,255,255,0.1)', color: TEXT, fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 8, cursor: composeText.trim() ? 'pointer' : 'default', opacity: sendingMessage ? 0.7 : 1 }}
                >
                  {sendingMessage ? 'Sending...' : 'Send'}
                </div>
              </div>
              {messageStatus && (
                <div style={{ marginTop: 8, fontSize: 12, color: messageStatus.type === 'success' ? GREEN : '#F87171' }}>{messageStatus.text}</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && <>
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
        </>}
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
      body: `Your program requires regular check-ins. Use the Check In Now button on your dashboard — your location is captured and recorded automatically.`,
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