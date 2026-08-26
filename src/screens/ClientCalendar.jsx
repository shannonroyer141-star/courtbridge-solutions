import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { CARD_BG, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme'
import { MONTH_THEMES, specialDayFor, dateKey } from '../monthThemes'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TYPE_COLORS = { 'Court Date': RED, 'Task': WARNING }

// Read-only month view for the client portal -- shows the client's own court
// dates and open tasks. No add/edit here; those stay provider-only.
export default function ClientCalendar({ clientId }) {
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()))
  const [courtDates, setCourtDates] = useState([])
  const [tasks, setTasks] = useState([])
  const [width, setWidth] = useState(window.innerWidth)

  async function fetchAll() {
    const [{ data: cd }, { data: tk }] = await Promise.all([
      supabase.from('court_dates').select('*').eq('client_id', clientId).order('hearing_date', { ascending: true }),
      supabase.from('tasks').select('*').eq('client_id', clientId).order('due_date', { ascending: true }),
    ])
    setCourtDates(cd || [])
    setTasks((tk || []).filter(t => t.due_date))
  }

  // clientId is stable for the life of this mounted component (the parent only
  // mounts ClientCalendar once client.id is known) -- this is a fetch-on-mount,
  // not state derived from a changing prop, so the lint rule's warning doesn't apply here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    function onResize() { setWidth(window.innerWidth) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isPhone = width < 640

  const itemsByDay = {}
  function addItem(dateObj, item) {
    if (!dateObj || isNaN(dateObj)) return
    const key = dateKey(dateObj)
    if (!itemsByDay[key]) itemsByDay[key] = []
    itemsByDay[key].push(item)
  }
  courtDates.forEach(cd => {
    if (!cd.hearing_date) return
    addItem(new Date(cd.hearing_date + 'T00:00:00'), {
      title: cd.hearing_type || 'Court date', type: 'Court Date', sub: cd.court_name, time: cd.hearing_time || null,
    })
  })
  tasks.forEach(t => {
    addItem(new Date(t.due_date), {
      title: t.title, type: 'Task', sub: t.completed ? 'Completed' : 'Due', time: null,
    })
  })

  function primaryColorFor(items) {
    if (!items || items.length === 0) return null
    const courtHit = items.find(it => it.type === 'Court Date')
    if (courtHit) return TYPE_COLORS['Court Date']
    return TYPE_COLORS[items[0].type]
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = dateKey(new Date())

  const theme = MONTH_THEMES[month]
  const accent = theme.accent
  const specialDay = specialDayFor(year, month)

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function changeMonth(delta) {
    const d = new Date(viewDate)
    d.setMonth(d.getMonth() + delta)
    setViewDate(d)
  }

  const selectedItems = itemsByDay[selectedDay] || []

  return (
    <div style={{ margin: '16px 22px', paddingBottom: isPhone ? 80 : 20, fontFamily: NAV_FONT }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>Calendar</div>
        <div style={{ fontSize: 13, letterSpacing: 6, marginTop: 2, opacity: 0.8 }}>{theme.icon} {theme.icon} {theme.icon}</div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1.4fr 1fr', gap: 16,
      }}>
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: isPhone ? 12 : 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <button onClick={() => changeMonth(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${BORDER}`, color: TEXT_MUTED, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>←</button>
            <div style={{ color: TEXT, fontSize: 16, fontWeight: 700 }}>{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => changeMonth(1)} style={{ background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${BORDER}`, color: TEXT_MUTED, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 }}>→</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: 11, color: TEXT_DIM, fontWeight: 700, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isPhone ? w[0] : w}
              </div>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />
              const key = dateKey(new Date(year, month, d))
              const items = itemsByDay[key] || []
              const isToday = key === todayKey
              const isSelected = key === selectedDay
              const dayColor = primaryColorFor(items)
              const isSpecial = d === specialDay
              return (
                <div key={key} onClick={() => setSelectedDay(key)} style={{
                  minHeight: isPhone ? 40 : 56, borderRadius: 10, padding: '6px 6px', cursor: 'pointer', position: 'relative',
                  background: isSelected ? `${accent}29` : dayColor ? `${dayColor}14` : 'rgba(255,255,255,0.02)',
                  border: isSelected ? `1.5px solid ${accent}` : isToday ? `1px solid ${accent}55` : dayColor ? '1px solid transparent' : `1px dotted ${accent}55`,
                  borderLeft: dayColor && !isSelected ? `3px solid ${dayColor}` : isSelected ? `1.5px solid ${accent}` : dayColor ? '1px solid transparent' : `1px dotted ${accent}55`,
                }}>
                  {isSpecial && <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 11, opacity: 0.85 }}>{theme.icon}</div>}
                  <div style={{ fontSize: 12, color: isToday ? accent : TEXT, fontWeight: isToday ? 800 : 500 }}>{d}</div>
                  {items.length > 0 && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: dayColor, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {items.length === 1 ? items[0].type : `${items.length} items`}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: 18 }}>
          <div style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ color: TEXT_DIM, fontSize: 12, marginBottom: 12 }}>{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}</div>
          {selectedItems.length === 0 ? (
            <div style={{ padding: '20px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.5 }}>🗓️</div>
              <p style={{ color: TEXT_DIM, fontSize: 13, margin: 0 }}>Nothing scheduled this day.</p>
            </div>
          ) : (
            selectedItems.map((it, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '10px 10px', marginBottom: i === selectedItems.length - 1 ? 0 : 8,
                borderRadius: 10, background: `${TYPE_COLORS[it.type]}0F`, border: `0.5px solid ${TYPE_COLORS[it.type]}33`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[it.type], marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{it.title}</div>
                  <div style={{ color: TEXT_DIM, fontSize: 12, marginTop: 2 }}>
                    {it.type}{it.time ? ` · ${it.time}` : ''}{it.sub ? ` · ${it.sub}` : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
