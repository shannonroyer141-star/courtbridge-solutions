import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { LANGUAGES, getTranslator } from '../i18n'
import { DARK_BG, CARD_BG, SIDEBAR_BG, BLUE, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'
import { NotesWarning } from '../components/VictimInfoWarning'

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

const OFFLINE_QUEUE_KEY = 'courtbridge_pending_checkins_v1'

function readOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') }
  catch { return [] }
}

function writeOfflineQueue(queue) {
  try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue)) }
  catch { /* storage unavailable — nothing more we can do client-side */ }
}

function isNetworkError(err) {
  if (!navigator.onLine) return true
  const msg = String(err?.message || '').toLowerCase()
  return err instanceof TypeError || msg.includes('fetch') || msg.includes('network')
}

function isToday(isoString) {
  return new Date(isoString).toDateString() === new Date().toDateString()
}

// Provider's quiet hours, e.g. "21:00" to "08:00" -- handles ranges that
// cross midnight. Uses the client device's local clock as a stand-in for
// the provider's local time (same jurisdiction/timezone in practice).
function isWithinQuietHours(startStr, endStr) {
  if (!startStr || !endStr) return false
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = startStr.split(':').map(Number)
  const [eh, em] = endStr.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  if (startMinutes === endMinutes) return false
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes
  return nowMinutes >= startMinutes || nowMinutes < endMinutes
}

const POPULATION_TYPES = ['catch_court', 'drug_court', 'bip', 'probation', 'mental_health', 'other']

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

const NAV_ICONS = {
  dashboard: '⊞', checkin: '📍', journey: '🏅', documents: '📄',
  forms: '✍️', messages: '💬', courtdates: '📅', settings: '📊',
}
const NAV_KEY_MAP = { dashboard: 'home', checkin: 'checkin', journey: 'journey', documents: 'documents', forms: 'forms', messages: 'messages', courtdates: 'courtdates', settings: 'progress' }

function buildNavItems(t) {
  return Object.keys(NAV_ICONS).map(id => ({ id, icon: NAV_ICONS[id], label: t('dashboard', 'nav')[NAV_KEY_MAP[id]] }))
}

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
  const [pendingCheckins, setPendingCheckins] = useState(() => readOfflineQueue())
  const [syncingQueue, setSyncingQueue] = useState(false)
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
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkOutMsg, setCheckOutMsg] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [threadMessages, setThreadMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [composeText, setComposeText] = useState('')
  const [composeUrgent, setComposeUrgent] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageStatus, setMessageStatus] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [hoveredNavItem, setHoveredNavItem] = useState(null)
  const [lang, setLang] = useState('en')

  const t = getTranslator(lang)
  const navItems = buildNavItems(t)
  const moreMenuItems = navItems.filter(item => !['dashboard', 'checkin', 'messages'].includes(item.id))

  async function changeLanguage(code) {
    setLang(code)
    if (client?.id) await supabase.from('clients').update({ preferred_language: code }).eq('id', client.id)
  }

  useEffect(() => {
    fetchClientData()
    setAffirmationIndex(Math.floor(Date.now() / 86400000) % 5)
  }, [])

  useEffect(() => {
    if (activeTab === 'messages' && client?.id) fetchMessages()
  }, [activeTab, client?.id])

  useEffect(() => {
    if (client?.id) syncPendingCheckins()
    window.addEventListener('online', syncPendingCheckins)
    return () => window.removeEventListener('online', syncPendingCheckins)
  }, [client?.id])

  async function syncPendingCheckins() {
    const queue = readOfflineQueue()
    if (queue.length === 0 || !client?.id) return
    setSyncingQueue(true)
    const stillPending = []
    let anySynced = false
    for (const item of queue) {
      if (item.client_id !== client.id) { stillPending.push(item); continue }
      try {
        const { error } = await supabase.from('checkins').insert({
          client_id: item.client_id,
          checked_in_at: item.checked_in_at,
          latitude: item.latitude,
          longitude: item.longitude,
          gps_accuracy_meters: item.gps_accuracy_meters,
          notes: null,
        })
        if (error) throw error
        anySynced = true
      } catch {
        stillPending.push(item)
      }
    }
    writeOfflineQueue(stillPending)
    setPendingCheckins(stillPending)
    setSyncingQueue(false)
    if (anySynced) fetchClientData()
  }

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
      const { data: providerProfile } = await supabase
        .from('profiles').select('phone, email, alert_email, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, backup_contact_name, backup_contact_phone').eq('id', client.provider_id).single()

      const { error } = await supabase.from('messages').insert({
        client_id: client.id,
        provider_id: client.provider_id,
        sender_role: 'client',
        is_urgent: composeUrgent,
        subject: composeUrgent ? 'Urgent message from participant' : 'Message from participant',
        body: composeText.trim(),
        message_type: 'client_message',
        delivered: true,
        to_email: providerProfile?.alert_email || providerProfile?.email || 'unknown@courtbridgesolutions.com',
      })
      if (error) throw error

      let urgentAlertFailed = false
      if (composeUrgent) {
        const inQuietHours = providerProfile?.quiet_hours_enabled && isWithinQuietHours(providerProfile.quiet_hours_start, providerProfile.quiet_hours_end)
        const useBackup = inQuietHours && providerProfile?.backup_contact_phone
        const targetPhone = useBackup ? providerProfile.backup_contact_phone : providerProfile?.phone
        const smsBody = useBackup
          ? `URGENT (after-hours backup contact) message from ${client.name} in CourtBridge: ${composeText.trim()}`
          : `URGENT message from ${client.name} in CourtBridge: ${composeText.trim()}`

        if (targetPhone) {
          try {
            const { data: { session: authSession } } = await supabase.auth.getSession()
            const smsResponse = await fetch(`https://howvgvrrxcpdiqjbnhzn.supabase.co/functions/v1/send-sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession.access_token}` },
              body: JSON.stringify({
                to_phone: targetPhone,
                body: smsBody,
                client_id: client.id,
              }),
            })
            if (!smsResponse.ok) urgentAlertFailed = true
          } catch (smsErr) {
            urgentAlertFailed = true
          }
        } else {
          urgentAlertFailed = true
        }
      }

      setComposeText('')
      setComposeUrgent(false)
      setMessageStatus(urgentAlertFailed
        ? { type: 'error', text: t('dashboard', 'common').errUrgentSmsFailed }
        : { type: 'success', text: t('dashboard', 'common').messageSent })
      fetchMessages()
    } catch (err) {
      setMessageStatus({ type: 'error', text: t('dashboard', 'common').errMessageSend })
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
      if (clientData.preferred_language) setLang(clientData.preferred_language)
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
      <html><head><title>Signed Form - ${escapeHtml(sig.form_title)}</title>
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
          <div class="meta">${escapeHtml(sig.form_title)}</div>
        </div>
        <div class="content">${escapeHtml(sig.form_content_snapshot)}</div>
        <div class="sig-block">
          <div>Electronically signed by: <strong>${escapeHtml(sig.signature_name)}</strong></div>
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

  function formatNoteDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
        <div class="content">${escapeHtml(note.content)}</div>
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
    if (!client?.id) { setCheckInMsg({ type: 'error', text: t('dashboard', 'common').errClientNotFound }); return }
    setCheckingIn(true)
    setCheckInMsg(null)
    let payload = null
    try {
      const now = new Date().toISOString()
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude, longitude } = pos.coords
      payload = { client_id: client.id, checked_in_at: now, latitude, longitude, gps_accuracy_meters: Math.round(pos.coords.accuracy) }

      if (!navigator.onLine) throw new Error('offline')

      const { error } = await supabase.from('checkins').insert({ ...payload, notes: null })
      if (error) throw error
      setCheckInMsg({ type: 'success', text: t('dashboard', 'common').checkInSuccess })
      fetchClientData()
    } catch (err) {
      const c = t('dashboard', 'common')
      if (payload && isNetworkError(err)) {
        const queue = [...readOfflineQueue(), { ...payload, queuedAt: new Date().toISOString() }]
        writeOfflineQueue(queue)
        setPendingCheckins(queue)
        setCheckInMsg({ type: 'success', text: c.checkInQueuedOffline })
      } else if (err.code === 1) setCheckInMsg({ type: 'error', text: c.errLocationDenied })
      else if (err.code === 2) setCheckInMsg({ type: 'error', text: c.errLocationFailed })
      else if (err.code === 3) setCheckInMsg({ type: 'error', text: c.errLocationTimeout })
      else setCheckInMsg({ type: 'error', text: c.errGeneric })
    } finally {
      setCheckingIn(false)
    }
  }

  async function handleCheckOut() {
    if (!todaysCheckin || checkedOutToday) return
    setCheckingOut(true)
    setCheckOutMsg(null)
    try {
      const now = new Date().toISOString()
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      const { latitude, longitude } = pos.coords
      const { data, error } = await supabase.from('checkins').update({
        checked_out_at: now,
        checkout_latitude: latitude,
        checkout_longitude: longitude,
        checkout_gps_accuracy_meters: Math.round(pos.coords.accuracy),
      }).eq('id', todaysCheckin.id).select()
      if (error) throw error
      if (!data || data.length === 0) throw new Error(t('dashboard', 'common').errCheckOutSave)
      setCheckOutMsg({ type: 'success', text: t('dashboard', 'common').checkOutSuccess })
      fetchClientData()
    } catch (err) {
      const c = t('dashboard', 'common')
      if (err.code === 1) setCheckOutMsg({ type: 'error', text: c.errLocationDenied })
      else if (err.code === 2) setCheckOutMsg({ type: 'error', text: c.errLocationFailed })
      else if (err.code === 3) setCheckOutMsg({ type: 'error', text: c.errLocationTimeout })
      else setCheckOutMsg({ type: 'error', text: err.message || c.errGeneric })
    } finally {
      setCheckingOut(false)
    }
  }

  const popKey = (client?.population_type && POPULATION_TYPES.includes(client.population_type)) ? client.population_type : 'other'
  const pop = t('dashboard', 'population')[popKey]

  const isCatch = client?.population_type === 'catch_court'

  const emailPrefix = session?.user?.email?.split('@')[0] || 'there'
  const displayName = client?.name || emailPrefix
  const firstName = displayName.split(' ')[0]

  function getGreeting() {
    const h = new Date().getHours()
    const c = t('dashboard', 'common')
    if (h < 12) return c.goodMorning
    if (h < 17) return c.goodAfternoon
    return c.goodEvening
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
  const syncedTodaysCheckin = checkIns.find(c => new Date(c.checked_in_at).toDateString() === new Date().toDateString())
  const pendingTodaysCheckin = pendingCheckins.find(p => p.client_id === client?.id && isToday(p.checked_in_at))
  const checkedInToday = !!syncedTodaysCheckin || !!pendingTodaysCheckin
  const todaysCheckin = syncedTodaysCheckin
  const checkedOutToday = !!todaysCheckin?.checked_out_at
  const hasUnsyncedCheckins = pendingCheckins.some(p => p.client_id === client?.id)
  const checkedOutTime = todaysCheckin?.checked_out_at
    ? new Date(todaysCheckin.checked_out_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null
  const checkedInTime = (todaysCheckin || pendingTodaysCheckin)?.checked_in_at
    ? new Date((todaysCheckin || pendingTodaysCheckin).checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : null
  const streak = checkIns.reduce((acc, ci, i, arr) => {
    if (i === 0) return 1
    const diff = (new Date(arr[i - 1].checked_in_at) - new Date(ci.checked_in_at)) / 86400000
    return diff <= 1.5 ? acc + 1 : acc
  }, checkIns.length > 0 ? 1 : 0)
  const complianceRate = checkIns.length > 0 ? Math.round((streak / Math.max(checkIns.length, 1)) * 100) : 0
  const daysSinceLastCheckin = checkIns.length > 0 ? (Date.now() - new Date(checkIns[0].checked_in_at)) / 86400000 : null
  const missedRecentCheckin = !checkedInToday && daysSinceLastCheckin !== null && daysSinceLastCheckin > 1.5
  const pendingFormsCount = formTemplates.filter(t => !mySignatures.some(s => s.form_template_id === t.id)).length
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
      <div style={{ color: TEXT_MUTED, fontSize: 14 }}>{t('dashboard', 'common').loadingDashboard}</div>
    </div>
  )

  if (isFirstTime) return <FirstTimeWelcome name={firstName} lang={lang} onDone={() => setIsFirstTime(false)} />

  if (client && (client.status === 'terminated' || client.status === 'inactive')) return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: NAV_FONT }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 19, fontWeight: 600, color: TEXT, marginBottom: 10 }}>{t('dashboard', 'common').statusChangedTitle}</div>
        <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 20 }}>
          {t('dashboard', 'common').statusChangedBody(t('dashboard', 'statusLabel')[client.status] || client.status)}
        </div>
        <div onClick={onLogout} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: TEXT, fontSize: 13, padding: '10px 20px', borderRadius: 8, cursor: 'pointer' }}>{t('dashboard', 'common').logOut}</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: DARK_BG, fontFamily: NAV_FONT }}>

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
          {/* Logo + toggle button */}
          <div style={{
            height: 56, display: 'flex', alignItems: 'center',
            justifyContent: showLabels ? 'space-between' : 'center',
            padding: showLabels ? '0 6px 0 14px' : 0,
            flexShrink: 0, borderBottom: `0.5px solid rgba(255,255,255,0.06)`,
          }}>
            {showLabels && <img src="/cb-logo.png" alt="CourtBridge Solutions" style={{ height: 24, width: 'auto' }} />}
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
            {navItems.map(item => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                showLabels={showLabels}
                hovered={hoveredNavItem === item.id}
                onHover={() => setHoveredNavItem(item.id)}
                onLeave={() => setHoveredNavItem(null)}
                onClick={() => {
                  if (item.id === 'checkin') { setActiveTab('dashboard'); handleCheckIn() }
                  else setActiveTab(item.id)
                }}
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
                <div onClick={onLogout} style={{ fontSize: 11, color: TEXT_MUTED, cursor: 'pointer', marginTop: 2 }}>{t('dashboard', 'nav').signOut}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {isMobile && <img src="/cb-logo.png" alt="CourtBridge Solutions" style={{ height: 20, width: 'auto', marginBottom: 8, display: 'block' }} />}
            <div style={{ fontSize: 19, fontWeight: 500, color: TEXT }}>{getGreeting()}, {firstName}</div>
            <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3 }}>{today} · Day {daysEnrolled} of your program</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: CARD_BG, border: `0.5px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: TEXT_MUTED }}>🔔</div>
        </div>

        {activeTab === 'documents' && (
          <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>{t('dashboard', 'documents').title}</div>
            <InnerCard>
              {documents.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>{t('dashboard', 'documents').empty}</div>
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
                    <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{t('dashboard', 'documents').view}</div>
                  </div>
                ))
              )}
            </InnerCard>
          </div>
        )}

        {activeTab === 'forms' && (() => {
          const signedIds = new Set(mySignatures.map(s => s.form_template_id))
          const pendingTemplates = formTemplates.filter(ft => !signedIds.has(ft.id))
          const fT = t('dashboard', 'forms')
          return (
            <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>{fT.needsSignature}</div>
              <InnerCard style={{ marginBottom: 16 }}>
                {pendingTemplates.length === 0 ? (
                  <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>{fT.emptyPending}</div>
                ) : (
                  pendingTemplates.map((ft, i) => (
                    <div key={ft.id} style={{ padding: '10px 0', borderBottom: i === pendingTemplates.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, color: TEXT }}>{ft.title}</div>
                          <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{ft.form_type}</div>
                        </div>
                        <div onClick={() => { setSigningTemplate(signingTemplate?.id === ft.id ? null : ft); setSignatureName('') }}
                          style={{ fontSize: 11, color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>
                          {signingTemplate?.id === ft.id ? fT.cancel : fT.readAndSign}
                        </div>
                      </div>
                      {signingTemplate?.id === ft.id && (
                        <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap', marginBottom: 10 }}>
                            {ft.content}
                          </div>
                          <input
                            placeholder={fT.signaturePlaceholder}
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
                            {signing ? fT.signing : fT.signAndSubmit}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </InnerCard>

              <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>{fT.signedForms}</div>
              <InnerCard>
                {mySignatures.length === 0 ? (
                  <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>{fT.emptySigned}</div>
                ) : (
                  mySignatures.map((s, i) => (
                    <div key={s.id} onClick={() => openSignatureSlip(s)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                      padding: '10px 0', borderBottom: i === mySignatures.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)`,
                    }}>
                      <div>
                        <div style={{ fontSize: 13, color: TEXT }}>{s.form_title}</div>
                        <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>{fT.signedOn(new Date(s.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}</div>
                      </div>
                      <div style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{fT.viewSavePdf}</div>
                    </div>
                  ))
                )}
              </InnerCard>
            </div>
          )
        })()}

        {activeTab === 'settings' && (() => {
          const pT = t('dashboard', 'progress')
          return (
          <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
            <div style={{ background: BLUE, borderRadius: 12, padding: '18px 20px', border: `0.5px solid rgba(91,155,240,0.2)`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {primaryProgram ? primaryProgram.order_name : pT.yourProgram}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: TEXT, marginTop: 4 }}>
                {pT.weekLabel(primaryProgram?.duration_weeks ? Math.min(primaryWeeksIn + 1, primaryProgram.duration_weeks) : weekNumber)}
                {primaryProgram?.duration_weeks ? pT.ofWeeks(primaryProgram.duration_weeks) : ''}
              </div>
              {primaryPct !== null && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${primaryPct}%`, background: ACCENT, borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{pT.percentThrough(primaryPct)}</div>
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>
              {nextCourtDate ? pT.beforeNextVisit(nextApptLabel) : pT.yourTasks}
            </div>
            <InnerCard>
              {tasksBeforeVisit.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>
                  {nextCourtDate ? pT.nothingDueBeforeVisit : pT.noTasksAssigned}
                </div>
              ) : (
                tasksBeforeVisit.map((tk, i) => (
                  <ListRow
                    key={tk.id}
                    icon="✓" iconBg="rgba(91,155,240,0.15)" iconColor={ACCENT}
                    title={tk.title}
                    meta={tk.due_date ? t('dashboard', 'home').dueLabel(new Date(tk.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : null}
                    last={i === tasksBeforeVisit.length - 1}
                  />
                ))
              )}
            </InnerCard>

            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, margin: '16px 0 10px' }}>{pT.privacyTitle}</div>
            <InnerCard>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                {pT.privacyBody}
                <br /><br />
                {pT.privacyContact} <strong style={{ color: TEXT }}>{pT.privacyContactBold}</strong> {pT.privacyContactEnd}
              </div>
            </InnerCard>

            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, margin: '16px 0 10px' }}>{t('onboarding', 'languagePickerLabel')}</div>
            <InnerCard>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(LANGUAGES).map(([code, langLabel]) => (
                  <div
                    key={code}
                    onClick={() => changeLanguage(code)}
                    style={{
                      padding: '7px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      border: lang === code ? `1px solid ${ACCENT}` : `0.5px solid ${BORDER}`,
                      background: lang === code ? 'rgba(91,155,240,0.15)' : 'transparent',
                      color: lang === code ? ACCENT : TEXT_MUTED, fontWeight: lang === code ? 700 : 400,
                    }}
                  >
                    {langLabel}
                  </div>
                ))}
              </div>
            </InnerCard>
          </div>
          )
        })()}

        {activeTab === 'journey' && (() => {
          const jT = t('dashboard', 'journey')
          return (
          <div style={{ margin: '16px 22px', paddingBottom: isMobile ? 80 : 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>{jT.myPrograms}</div>
            <InnerCard style={{ marginBottom: 16 }}>
              {clientPrograms.length === 0 && (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>{jT.noProgramsYet}</div>
              )}
              {clientPrograms.map((p, i) => {
                const weeksIn = Math.floor((Date.now() - new Date(p.start_date)) / (7 * 86400000))
                const pct = p.duration_weeks ? Math.min(Math.round((weeksIn / p.duration_weeks) * 100), 100) : null
                const isDone = p.status === 'completed'
                const notesForProgram = progressNotes.filter(n => n.client_program_id === p.id)
                return (
                  <div key={p.id} style={{ padding: '10px 0', borderBottom: i === clientPrograms.length - 1 ? 'none' : `0.5px solid rgba(255,255,255,0.05)` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, color: TEXT }}>{p.order_name}</div>
                      <div style={{
                        fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                        background: isDone ? 'rgba(76,175,125,0.15)' : p.status === 'terminated' ? 'rgba(248,113,113,0.15)' : 'rgba(91,155,240,0.15)',
                        color: isDone ? GREEN : p.status === 'terminated' ? RED : ACCENT,
                      }}>
                        {isDone ? jT.completedBadge : p.status === 'terminated' ? jT.endedBadge : jT.inProgressBadge}
                      </div>
                    </div>
                    {pct !== null && !isDone && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>{jT.weekOf(Math.max(weeksIn, 0), p.duration_weeks)}</div>
                      </div>
                    )}
                    {isDone && p.completed_at && (
                      <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>{jT.completedOn(new Date(p.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}</div>
                    )}
                    {notesForProgram.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid rgba(255,255,255,0.08)` }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{jT.progressNotesLabel}</div>
                        {notesForProgram.map((n, ni) => (
                          <div key={n.id} onClick={() => openNotePdf(n)} style={{ cursor: 'pointer' }}>
                            <ListRow
                              icon="📝" iconBg="rgba(91,155,240,0.15)" iconColor={ACCENT}
                              title={formatNoteDate(n.note_date)}
                              badgeText={jT.viewArrow} badgeColor={ACCENT} badgeBg="rgba(91,155,240,0.1)"
                              last={ni === notesForProgram.length - 1}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </InnerCard>

            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>{jT.myAchievements}</div>
            <InnerCard>
              {milestones.length === 0 ? (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>{jT.noBadgesYet}</div>
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

            {progressNotes.some(n => !n.client_program_id) && (
              <>
                <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, margin: '16px 0 10px' }}>{jT.generalNotes}</div>
                <InnerCard>
                  {progressNotes.filter(n => !n.client_program_id).map((n, i, arr) => (
                    <div key={n.id} onClick={() => openNotePdf(n)} style={{ cursor: 'pointer' }}>
                      <ListRow
                        icon="📝" iconBg="rgba(91,155,240,0.15)" iconColor={ACCENT}
                        title={formatNoteDate(n.note_date)}
                        badgeText={jT.viewArrow} badgeColor={ACCENT} badgeBg="rgba(91,155,240,0.1)"
                        last={i === arr.length - 1}
                      />
                    </div>
                  ))}
                </InnerCard>
              </>
            )}
          </div>
          )
        })()}

        {activeTab === 'messages' && (() => {
          const mT = t('dashboard', 'messages')
          return (
          <div style={{ margin: '16px 22px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 12 }}>
              {messagesLoading && <div style={{ fontSize: 13, color: TEXT_MUTED }}>{mT.loading}</div>}
              {!messagesLoading && threadMessages.length === 0 && (
                <div style={{ fontSize: 13, color: TEXT_DIM, padding: '20px 0' }}>{mT.empty}</div>
              )}
              {threadMessages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.sender_role === 'client' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: m.sender_role === 'client' ? BLUE : CARD_BG,
                  border: m.is_urgent ? `1px solid ${WARNING}` : `0.5px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                }}>
                  {m.is_urgent && <div style={{ fontSize: 10, fontWeight: 700, color: WARNING, textTransform: 'uppercase', marginBottom: 4 }}>{mT.urgentLabel}</div>}
                  <div style={{ fontSize: 13, color: TEXT, whiteSpace: 'pre-wrap' }}>{m.body}</div>
                  <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 6 }}>{new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 12 }}>
              <NotesWarning />
              <textarea
                value={composeText}
                onChange={e => setComposeText(e.target.value)}
                placeholder={mT.composePlaceholder}
                rows={2}
                style={{ width: '100%', boxSizing: 'border-box', background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: TEXT, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: composeUrgent ? WARNING : TEXT_MUTED, cursor: 'pointer' }}>
                  <input type="checkbox" checked={composeUrgent} onChange={e => setComposeUrgent(e.target.checked)} />
                  {mT.markUrgent}
                </label>
                <div
                  onClick={!sendingMessage && composeText.trim() ? sendClientMessage : undefined}
                  style={{ background: composeText.trim() ? BLUE : 'rgba(255,255,255,0.1)', color: TEXT, fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 8, cursor: composeText.trim() ? 'pointer' : 'default', opacity: sendingMessage ? 0.7 : 1 }}
                >
                  {sendingMessage ? mT.sending : mT.send}
                </div>
              </div>
              {messageStatus && (
                <div style={{ marginTop: 8, fontSize: 12, color: messageStatus.type === 'success' ? GREEN : RED }}>{messageStatus.text}</div>
              )}
            </div>
          </div>
          )
        })()}

        {activeTab === 'dashboard' && <>
        {/* Affirmation */}
        <div style={{ margin: '14px 22px 0', background: CARD_BG, borderRadius: 8, padding: '13px 14px', border: `0.5px solid rgba(91,155,240,0.15)` }}>
          <div style={{ fontSize: 10, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{t('dashboard', 'home').affirmationLabel}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, fontStyle: 'italic' }}>"{affirmation}"</div>
        </div>

        {pendingFormsCount > 0 && (
          <div onClick={() => setActiveTab('forms')} style={{ margin: '16px 22px 0', background: 'rgba(61,111,168,0.1)', border: `0.5px solid rgba(61,111,168,0.3)`, borderRadius: 10, padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: TEXT }}>
              <strong style={{ color: WARNING }}>{t('dashboard', 'home').attentionLabel}</strong> {t('dashboard', 'home').pendingFormsBody(pendingFormsCount)}
            </div>
            <div style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>{t('dashboard', 'home').reviewArrow}</div>
          </div>
        )}
        {/* Hero check-in */}
        <div style={{ margin: '16px 22px 0', background: BLUE, borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 20, border: `0.5px solid rgba(91,155,240,0.2)` }}>
          <StreakRing streak={streak} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: TEXT }}>
              {checkedInToday ? t('dashboard', 'home').checkedInStreak(streak) : missedRecentCheckin ? t('dashboard', 'home').backOnTrack : t('dashboard', 'home').onStreak(streak)}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.5 }}>
              {missedRecentCheckin
                ? t('dashboard', 'home').missedRecentBody
                : nextApptDate
                ? t('dashboard', 'home').nextApptBody(nextApptLabel, nextApptSub)
                : t('dashboard', 'home').keepUpBody}
            </div>
            {checkInMsg && (
              <div style={{ marginTop: 8, fontSize: 12, color: checkInMsg.type === 'success' ? GREEN : WARNING }}>
                {checkInMsg.text}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                {checkingIn ? t('dashboard', 'home').gettingLocation : checkedInToday ? t('dashboard', 'home').checkedInTodayLabel(checkedInTime) : `${pop.checkInLabel} 📍`}
              </div>
              {syncedTodaysCheckin && (
                <div
                  onClick={handleCheckOut}
                  style={{
                    marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: checkedOutToday ? 'rgba(76,175,125,0.2)' : 'rgba(61,111,168,0.2)',
                    border: `0.5px solid ${checkedOutToday ? 'rgba(76,175,125,0.4)' : 'rgba(61,111,168,0.4)'}`,
                    color: TEXT, fontSize: 12, padding: '7px 14px', borderRadius: 8,
                    cursor: checkedOutToday || checkingOut ? 'default' : 'pointer',
                    opacity: checkingOut ? 0.7 : 1,
                  }}
                >
                  {checkingOut ? t('dashboard', 'home').gettingLocation : checkedOutToday ? t('dashboard', 'home').checkedOutLabel(checkedOutTime) : `${t('dashboard', 'home').checkOutButton} 📍`}
                </div>
              )}
            </div>
            {checkOutMsg && (
              <div style={{ marginTop: 8, fontSize: 12, color: checkOutMsg.type === 'success' ? GREEN : WARNING }}>
                {checkOutMsg.text}
              </div>
            )}
            {hasUnsyncedCheckins && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {syncingQueue ? t('dashboard', 'home').syncingNow : t('dashboard', 'home').waitingToSync}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px 0' }}>
          <StatCard label={t('dashboard', 'home').statCompliance} value={`${complianceRate}%`} sub={t('dashboard', 'home').statAllTime} valueColor={GREEN} />
          <StatCard label={t('dashboard', 'home').statCheckinsMonth} value={checkIns.length} sub={checkedInToday ? t('dashboard', 'home').statIncludingToday : t('dashboard', 'home').statNotYetToday} valueColor={ACCENT} />
          <StatCard label={t('dashboard', 'home').statNextAppt} value={nextApptLabel || '—'} sub={nextApptSub} valueColor={nextApptDate ? WARNING : TEXT_MUTED} />
        </div>

        {/* Safety note — CATCH only */}
        {isCatch && (
          <div style={{ margin: '10px 22px 0', background: 'rgba(61,111,168,0.08)', borderRadius: 8, padding: '13px 14px', border: `0.5px solid rgba(61,111,168,0.25)` }}>
            <div style={{ fontSize: 10, color: WARNING, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{t('dashboard', 'home').safetyNoteTitle}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {t('dashboard', 'home').safetyNoteBody}
            </div>
          </div>
        )}

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: `14px 22px ${isMobile ? 80 : 20}px` }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>{t('dashboard', 'home').importantDatesTasks}</div>
            <InnerCard>
              {courtDates.length === 0 && tasks.length === 0 && (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '4px 0' }}>{t('dashboard', 'home').nothingUpcoming}</div>
              )}
              {courtDates.slice(0, 3).map((cd, i) => (
                <ListRow
                  key={cd.id}
                  icon="⚖️"
                  iconBg="rgba(200,80,0,0.12)"
                  iconColor={WARNING}
                  title={cd.hearing_type || t('dashboard', 'home').courtAppearance}
                  meta={`${new Date(cd.hearing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${cd.court_name || t('dashboard', 'home').locationTBD}`}
                  badgeText={i === 0 ? nextApptLabel : new Date(cd.hearing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  badgeColor={WARNING}
                  badgeBg="rgba(200,80,0,0.2)"
                  last={i === courtDates.slice(0, 3).length - 1 && tasks.length === 0}
                />
              ))}
              {tasks.slice(0, 3).map((t2, i) => (
                <ListRow
                  key={t2.id}
                  icon="📋"
                  iconBg="rgba(91,155,240,0.12)"
                  iconColor={ACCENT}
                  title={t2.title}
                  meta={t2.due_date ? t('dashboard', 'home').dueLabel(new Date(t2.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : t('dashboard', 'home').assignedByProvider}
                  badgeText={t('dashboard', 'home').taskBadge}
                  badgeColor={ACCENT}
                  badgeBg="rgba(91,155,240,0.15)"
                  last={i === tasks.slice(0, 3).length - 1}
                />
              ))}
            </InnerCard>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 10 }}>{t('dashboard', 'home').recentCheckins}</div>
            <InnerCard>
              {checkIns.length > 0 ? checkIns.slice(0, 3).map((ci, i) => (
                <ListRow
                  key={ci.id}
                  icon="✓"
                  iconBg="rgba(76,175,125,0.12)"
                  iconColor={GREEN}
                  title={new Date(ci.checked_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + new Date(ci.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  meta={ci.location_name || (ci.latitude ? t('dashboard', 'home').gpsVerified : t('dashboard', 'home').locationRecorded)}
                  badgeText={isCatch ? t('dashboard', 'home').safeBadge : t('dashboard', 'home').onTimeBadge}
                  badgeColor={GREEN}
                  badgeBg="rgba(76,175,125,0.15)"
                  last={i === checkIns.slice(0, 3).length - 1}
                />
              )) : (
                <div style={{ fontSize: 12, color: TEXT_DIM, padding: '8px 0' }}>{t('dashboard', 'home').noCheckinsYet}</div>
              )}
            </InnerCard>
          </div>
        </div>
        </>}
      </div>

      {/* MORE MENU — mobile only, overlay listing tabs that don't fit the bottom bar */}
      {isMobile && showMoreMenu && (
        <>
          <div onClick={() => setShowMoreMenu(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 110 }} />
          <div style={{
            position: 'fixed', left: 0, right: 0, bottom: 62, background: SIDEBAR_BG,
            borderTop: `0.5px solid rgba(255,255,255,0.08)`, borderRadius: '14px 14px 0 0',
            zIndex: 111, padding: '8px 0 4px', maxHeight: '60vh', overflowY: 'auto',
          }}>
            {moreMenuItems.map(({ id, icon, label }) => (
              <div key={id} onClick={() => { setActiveTab(id); setShowMoreMenu(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer',
                color: activeTab === id ? TEXT : 'rgba(255,255,255,0.7)',
                background: activeTab === id ? 'rgba(91,155,240,0.1)' : 'transparent',
              }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 14 }}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* BOTTOM NAV — mobile only */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 62,
          background: SIDEBAR_BG, borderTop: `0.5px solid rgba(255,255,255,0.08)`,
          display: 'flex', alignItems: 'stretch', zIndex: 100,
        }}>
          {[
            { id: 'dashboard', icon: '⊞', label: t('dashboard', 'nav').home },
            { id: 'checkin',   icon: '📍', label: t('dashboard', 'nav').checkin },
            { id: 'messages',  icon: '💬', label: t('dashboard', 'nav').messages },
            { id: 'more',      icon: '☰', label: t('dashboard', 'nav').more },
          ].map(({ id, icon, label }) => {
            const active = id === 'more' ? showMoreMenu : (activeTab === id && !showMoreMenu)
            const handleTap = () => {
              if (id === 'checkin') { setShowMoreMenu(false); setActiveTab('dashboard'); handleCheckIn() }
              else if (id === 'more') setShowMoreMenu(m => !m)
              else { setShowMoreMenu(false); setActiveTab(id) }
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

function FirstTimeWelcome({ name, lang, onDone }) {
  const [step, setStep] = useState(0)
  const t = getTranslator(lang)
  const w = t('dashboard', 'welcome')
  const steps = w.steps.map(s => ({
    title: typeof s.title === 'function' ? s.title(name) : s.title,
    body: s.body,
    cta: s.cta,
  }))
  const current = steps[step]
  const isLast = step === steps.length - 1
  return (
    <div style={{ minHeight: '100vh', background: DARK_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: NAV_FONT }}>
      <div style={{ fontSize: 15, fontWeight: 500, color: TEXT, marginBottom: 4 }}>CourtBridge Solutions</div>
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 40 }}>{w.portalSubtitle}</div>
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
            {w.back}
          </button>
        )}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 28 }}>{w.tagline}</div>
    </div>
  )
}