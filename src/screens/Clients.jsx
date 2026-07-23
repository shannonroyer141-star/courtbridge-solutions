import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import SendEnrollmentLink from './SendEnrollmentLink'
import { CARD_BG, ACCENT, GREEN, ORANGE, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'

const STATUS_COLORS = {
  active: { bg: 'rgba(76,175,125,0.15)', text: GREEN },
  inactive: { bg: 'rgba(255,255,255,0.08)', text: TEXT_MUTED },
  graduated: { bg: 'rgba(91,155,240,0.15)', text: ACCENT },
  terminated: { bg: 'rgba(248,113,113,0.15)', text: RED }
}

const PROGRAM_LABELS = {
  drug_court: 'Drug Court',
  mental_health: 'Mental Health Court',
  bip: 'BIP',
  human_trafficking: 'Human Trafficking',
  catch_court: 'CATCH Court',
  probation: 'Probation',
  standard: 'Standard',
  other: 'Other'
}

export default function Clients({ session, onNavigate }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => { fetchClients() }, [])

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isPhone = width < 640

  async function fetchClients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setClients(data || [])
    setLoading(false)
  }

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  function statusBadge(status) {
    const s = STATUS_COLORS[status] || STATUS_COLORS.active
    return (
      <span style={{ background: s.bg, color: s.text, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>
        {status || 'active'}
      </span>
    )
  }

  function onboardingBadge(client) {
    if (client.onboarding_complete) {
      return <span style={{ background: 'rgba(76,175,125,0.15)', color: GREEN, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Enrolled</span>
    }
    return <span style={{ background: 'rgba(255,140,66,0.15)', color: ORANGE, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Pending</span>
  }

  return (
    <div style={{ fontFamily: NAV_FONT, padding: isPhone ? 14 : 24 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TEXT, margin: 0 }}>Clients</h1>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 4 }}>
            {clients.length} total · {clients.filter(c => c.status === 'active' || !c.status).length} active
          </div>
        </div>
        <button
          onClick={() => setShowEnrollModal(true)}
          style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          + Enroll New Participant
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: NAV_FONT, background: 'rgba(255,255,255,0.04)', color: TEXT }}
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '10px 14px', border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 14, background: CARD_BG, color: TEXT, cursor: 'pointer', fontFamily: NAV_FONT, outline: 'none' }}
        >
          <option value="all">All Clients</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: TEXT_MUTED, fontSize: 15 }}>Loading clients...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ background: CARD_BG, borderRadius: 12, padding: 48, textAlign: 'center', border: `0.5px solid ${BORDER}` }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
            {search || filter !== 'all' ? 'No clients match your search' : 'No clients enrolled yet'}
          </div>
          <div style={{ fontSize: 14, color: TEXT_MUTED, marginBottom: 24, lineHeight: 1.6 }}>
            {search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Enroll your first participant by clicking the button above.'}
          </div>
          {!search && filter === 'all' && (
            <button onClick={() => setShowEnrollModal(true)}
              style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              + Enroll First Participant
            </button>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(client => (
            <div
              key={client.id}
              style={{ background: CARD_BG, borderRadius: 12, padding: isPhone ? '14px 16px' : '16px 20px', border: `0.5px solid ${BORDER}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: isPhone ? 'flex-start' : 'center', flexWrap: 'wrap', gap: 12, flexDirection: isPhone ? 'column' : 'row' }}
              onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
            >
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{client.name}</div>
                  {statusBadge(client.status)}
                  {onboardingBadge(client)}
                </div>
                <div style={{ fontSize: 13, color: TEXT_MUTED, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {client.phone && <span>📱 {client.phone}</span>}
                  {client.email && <span>✉ {client.email}</span>}
                  {client.population_type && <span>⚖️ {PROGRAM_LABELS[client.population_type] || client.population_type}</span>}
                  {client.program_phase && <span>📍 {client.program_phase}</span>}
                </div>
              </div>
              <div style={{ textAlign: isPhone ? 'left' : 'right', fontSize: 12, color: TEXT_DIM }}>
                <div>Enrolled {new Date(client.created_at).toLocaleDateString()}</div>
                {client.onboarding_completed_at && (
                  <div style={{ color: GREEN }}>Active since {new Date(client.onboarding_completed_at).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          ))}

          {selectedClient && (
            <div style={{ background: CARD_BG, borderRadius: 12, padding: isPhone ? '16px 18px' : '20px 24px', border: `1px solid ${ACCENT}`, marginTop: -4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{selectedClient.name} — Detail</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {onNavigate && (
                    <button onClick={() => onNavigate('clientprofile', selectedClient.id)}
                      style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      View Full Profile & Journey →
                    </button>
                  )}
                  <button onClick={() => setSelectedClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: TEXT_MUTED }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {[
                  ['Case Number', selectedClient.case_number],
                  ['Date of Birth', selectedClient.date_of_birth ? new Date(selectedClient.date_of_birth + 'T00:00:00').toLocaleDateString() : null],
                  ['Enrollment Type', selectedClient.enrollment_type?.replace(/_/g, ' ')],
                  ['Program Phase', selectedClient.program_phase],
                  ['GPS Consent', selectedClient.gps_consent_signed_at ? new Date(selectedClient.gps_consent_signed_at).toLocaleDateString() : 'Pending'],
                  ['Terms Signed', selectedClient.terms_signed_at ? new Date(selectedClient.terms_signed_at).toLocaleDateString() : 'Pending'],
                  ['SMS Consent', selectedClient.phone ? (selectedClient.sms_consent_signed_at ? new Date(selectedClient.sms_consent_signed_at).toLocaleDateString() : 'Not on file') : null],
                ].map(([lbl, val]) => val ? (
                  <div key={lbl}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{lbl}</div>
                    <div style={{ fontSize: 14, color: TEXT, textTransform: 'capitalize' }}>{val}</div>
                  </div>
                ) : null)}
              </div>
              {selectedClient.reporting_requirements && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Reporting Requirements</div>
                  <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px' }}>{selectedClient.reporting_requirements}</div>
                </div>
              )}
              {selectedClient.checkin_schedule && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Check-In Schedule</div>
                  <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px' }}>{selectedClient.checkin_schedule}</div>
                </div>
              )}
              {!selectedClient.onboarding_complete && (
                <div style={{ marginTop: 16, background: 'rgba(255,140,66,0.1)', border: `0.5px solid ${ORANGE}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 13, color: ORANGE }}>⚠ This participant has not completed enrollment yet.</div>
                  <button onClick={() => setShowEnrollModal(true)}
                    style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Resend Enrollment Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showEnrollModal && (
        <SendEnrollmentLink
          providerId={session.user.id}
          onClose={() => setShowEnrollModal(false)}
          onSuccess={() => { setShowEnrollModal(false); fetchClients() }}
        />
      )}
    </div>
  )
}
