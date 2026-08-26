import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';
import { MONTH_THEMES, specialDayFor, dateKey } from '../monthThemes';

// calendar_events.event_type has a DB check constraint requiring these exact
// lowercase values -- 'court_date' is excluded from the manual form since
// court dates are pulled in automatically from the real court_dates table.
const EVENT_TYPE_OPTIONS = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'check_in', label: 'Check-In Due' },
  { value: 'reporting_due', label: 'Reporting Due' },
  { value: 'program_review', label: 'Program Review' },
  { value: 'other', label: 'Other' },
];

const EVENT_TYPE_LABELS = Object.fromEntries(EVENT_TYPE_OPTIONS.map(o => [o.value, o.label]));

// Semantic colors stay constant across skins -- red always means "urgent/court",
// so a skin only reskins the chrome (accent, background), never what a color means.
const TYPE_COLORS = {
  'Court Date': RED,
  'Task': WARNING,
  'Check-In Due': '#5B9BF0',
  'Appointment': GREEN,
  'Reporting Due': WARNING,
  'Program Review': '#5B9BF0',
  'Other': '#7DA6E0',
};
const TYPE_PRIORITY = ['Court Date', 'Reporting Due', 'Task', 'Check-In Due', 'Program Review', 'Appointment', 'Other'];

// Base chrome stays constant -- only accent + a small decorative touch shift per month below.
const SKIN = { pageBg: 'linear-gradient(160deg, #1A2434 0%, #202D40 100%)', cardBg: '#212E42' };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [manualEvents, setManualEvents] = useState([]);
  const [courtDates, setCourtDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', event_date: '', event_type: '', client_name: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [calendarStyle, setCalendarStyle] = useState('modern');

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isPhone = width < 640;

  async function fetchAll() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: ev }, { data: cd }, { data: tk }] = await Promise.all([
      supabase.from('calendar_events').select('*').order('event_date', { ascending: true }),
      supabase.from('court_dates').select('*, clients(name)').order('hearing_date', { ascending: true }),
      supabase.from('tasks').select('*').eq('provider_id', user.id).order('due_date', { ascending: true }),
    ]);
    setManualEvents(ev || []);
    setCourtDates(cd || []);
    setTasks((tk || []).filter(t => t.due_date));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.event_date) return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('calendar_events').insert([{
      ...form,
      provider_id: user.id,
      start_time: new Date(form.event_date).toISOString(),
    }]);
    if (error) {
      setSaveError('Could not save event: ' + error.message);
    } else {
      setForm({ title: '', event_date: '', event_type: '', client_name: '', notes: '' });
      setShowForm(false);
      fetchAll();
    }
    setSaving(false);
  }

  // Merge everything into one map: dateKey -> [{title, type, sub, time}]
  const itemsByDay = {};
  function addItem(dateObj, item) {
    if (!dateObj || isNaN(dateObj)) return;
    const key = dateKey(dateObj);
    if (!itemsByDay[key]) itemsByDay[key] = [];
    itemsByDay[key].push(item);
  }
  manualEvents.forEach(e => {
    if (!e.start_time) return;
    addItem(new Date(e.start_time), {
      title: e.title, type: EVENT_TYPE_LABELS[e.event_type] || 'Other', sub: e.client_name, notes: e.notes,
      time: new Date(e.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    });
  });
  courtDates.forEach(cd => {
    if (!cd.hearing_date) return;
    addItem(new Date(cd.hearing_date + 'T00:00:00'), {
      title: `${cd.clients?.name || 'Unknown'} — ${cd.hearing_type || 'Court date'}`, type: 'Court Date',
      sub: cd.court_name, time: cd.hearing_time || null,
    });
  });
  tasks.forEach(t => {
    addItem(new Date(t.due_date), {
      title: t.title, type: 'Task', sub: t.completed ? 'Completed' : 'Due', time: null,
    });
  });

  function primaryColorFor(items) {
    if (!items || items.length === 0) return null;
    for (const type of TYPE_PRIORITY) {
      const hit = items.find(it => it.type === type);
      if (hit) return TYPE_COLORS[type] || skin.accent;
    }
    return TYPE_COLORS[items[0].type] || skin.accent;
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(new Date());

  const theme = MONTH_THEMES[month];
  const isClassic = calendarStyle === 'classic';
  const skin = isClassic
    ? { ...SKIN, accent: theme.classicPrimary, secondary: theme.classicSecondary, accentSoft: `${theme.classicPrimary}22`, cardBg: '#FBF7EE', cellBg: '#FFFDF8' }
    : { ...SKIN, accent: theme.accent, accentSoft: `${theme.accent}29`, cellBg: 'rgba(255,255,255,0.02)' };
  const ink = isClassic ? '#3A2E22' : TEXT;
  const inkMuted = isClassic ? 'rgba(58,46,34,0.55)' : TEXT_MUTED;
  const inkDim = isClassic ? 'rgba(58,46,34,0.4)' : TEXT_DIM;
  const cardBorder = isClassic ? '1px solid rgba(58,46,34,0.14)' : `0.5px solid ${BORDER}`;
  const specialDay = specialDayFor(year, month);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function changeMonth(delta) {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + delta);
    setViewDate(d);
  }

  const selectedItems = itemsByDay[selectedDay] || [];

  const s = {
    page: { padding: isPhone ? '20px 16px' : '30px', fontFamily: NAV_FONT, background: SKIN.pageBg, minHeight: '100%', margin: -1 * (isPhone ? 20 : 30), paddingTop: isPhone ? 20 : 30 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
    title: { color: TEXT, margin: 0, fontSize: 22, fontWeight: 700 },
    addBtn: { padding: '10px 18px', background: theme.accent, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    styleToggle: { display: 'flex', background: 'rgba(255,255,255,0.06)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 2, gap: 2 },
    styleToggleBtn: active => ({ padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: active ? theme.accent : 'transparent', color: active ? 'white' : TEXT_MUTED }),
    layout: { display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1.4fr 1fr', gap: 20 },
    calCard: {
      background: theme.image
        ? `${isClassic ? 'linear-gradient(180deg, rgba(251,247,238,0.4), rgba(251,247,238,0.85) 55%, rgba(251,247,238,0.93))' : 'linear-gradient(180deg, rgba(26,36,52,0.3), rgba(26,36,52,0.82) 55%, rgba(26,36,52,0.92))'}, url(${theme.image}) center/cover no-repeat`
        : skin.cardBg,
      border: cardBorder, borderRadius: 14, padding: isPhone ? 12 : 20, boxShadow: isClassic ? '0 8px 24px rgba(58,46,34,0.12)' : '0 8px 24px rgba(0,0,0,0.18)',
    },
    monthNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    monthLabel: { color: ink, fontSize: 17, fontWeight: 700, letterSpacing: '-0.2px' },
    navBtn: { background: isClassic ? 'rgba(58,46,34,0.06)' : 'rgba(255,255,255,0.06)', border: cardBorder, color: inkMuted, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 14 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 },
    weekdayCell: { textAlign: 'center', fontSize: 11, color: inkDim, fontWeight: 700, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' },
    card: { background: skin.cardBg, border: cardBorder, borderRadius: 14, padding: 20, boxShadow: isClassic ? '0 8px 24px rgba(58,46,34,0.12)' : '0 8px 24px rgba(0,0,0,0.18)' },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Calendar</h1>
          {!theme.image && (
            <div style={{ fontSize: 13, letterSpacing: 6, marginTop: 2, opacity: 0.8 }}>{theme.icon} {theme.icon} {theme.icon}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={s.styleToggle}>
            <button style={s.styleToggleBtn(!isClassic)} onClick={() => setCalendarStyle('modern')}>Modern</button>
            <button style={s.styleToggleBtn(isClassic)} onClick={() => setCalendarStyle('classic')}>Classic</button>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>+ Add Event</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...s.calCard, marginBottom: 20 }}>
          <input placeholder="Event Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT }} />
          <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, colorScheme: 'dark' }} />
          <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXT }}>
            <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select Type</option>
            {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1E2A3A', color: '#fff' }}>{o.label}</option>)}
          </select>
          <input placeholder="Client Name (optional)" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT }} />
          <NotesWarning />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 15, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', minHeight: 70, background: 'rgba(255,255,255,0.04)', color: TEXT }} />
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.event_date}
            style={{ padding: '12px 25px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save Event'}
          </button>
        </div>
      )}

      <p style={{ color: TEXT_DIM, fontSize: 12, margin: '0 0 16px' }}>
        Court dates and tasks are pulled in automatically. Use "+ Add Event" only for things that don't already live in Court Dates or Tasks.
      </p>

      <div style={s.layout}>
        <div style={s.calCard}>
          <div style={s.monthNav}>
            <button style={s.navBtn} onClick={() => changeMonth(-1)}>←</button>
            <div style={s.monthLabel}>{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            <button style={s.navBtn} onClick={() => changeMonth(1)}>→</button>
          </div>
          <div style={s.grid}>
            {WEEKDAYS.map((w, wi) => {
              const isWeekend = wi === 0 || wi === 6;
              const bandColor = isWeekend ? skin.secondary : skin.accent;
              return (
                <div key={w} style={isClassic
                  ? { textAlign: 'center', fontSize: 11, color: 'white', fontWeight: 700, padding: '5px 0', textTransform: 'uppercase', letterSpacing: '0.04em', background: bandColor, borderRadius: 5 }
                  : s.weekdayCell}>
                  {isPhone ? w[0] : w}
                </div>
              );
            })}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const key = dateKey(new Date(year, month, d));
              const items = itemsByDay[key] || [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDay;
              const dayColor = primaryColorFor(items);
              const isSpecial = d === specialDay;
              return (
                <div key={key} onClick={() => setSelectedDay(key)} style={{
                  minHeight: isPhone ? 44 : 62, borderRadius: 10, padding: '6px 6px', cursor: 'pointer',
                  background: isSelected ? skin.accentSoft : dayColor ? `${dayColor}14` : skin.cellBg,
                  border: isSelected ? `1.5px solid ${skin.accent}` : isToday ? `1px solid ${skin.accent}55` : dayColor ? '1px solid transparent' : `1px dotted ${skin.accent}55`,
                  borderLeft: dayColor && !isSelected ? `3px solid ${dayColor}` : isSelected ? `1.5px solid ${skin.accent}` : dayColor ? '1px solid transparent' : `1px dotted ${skin.accent}55`,
                  transition: 'background 0.12s ease',
                  position: 'relative',
                }}>
                  {isSpecial && <div style={{ position: 'absolute', top: 4, right: 6, fontSize: 12, opacity: 0.85 }}>{theme.icon}</div>}
                  <div style={{ fontSize: 12, color: isToday ? skin.accent : ink, fontWeight: isToday ? 800 : 500 }}>{d}</div>
                  {items.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: dayColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {items.length === 1 ? items[0].type : `${items.length} items`}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.card}>
          <div style={{ color: ink, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ color: inkDim, fontSize: 12, marginBottom: 14 }}>{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}</div>
          {selectedItems.length === 0 ? (
            <div style={{ padding: '28px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>🗓️</div>
              <p style={{ color: inkDim, fontSize: 13, margin: 0 }}>Nothing scheduled this day.</p>
            </div>
          ) : (
            selectedItems.map((it, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 12px', marginBottom: i === selectedItems.length - 1 ? 0 : 8,
                borderRadius: 10, background: `${TYPE_COLORS[it.type] || skin.accent}0F`, border: `0.5px solid ${(TYPE_COLORS[it.type] || skin.accent)}33`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[it.type] || skin.accent, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ color: ink, fontSize: 14, fontWeight: 600 }}>{it.title}</div>
                  <div style={{ color: inkDim, fontSize: 12, marginTop: 2 }}>
                    {it.type}{it.time ? ` · ${it.time}` : ''}{it.sub ? ` · ${it.sub}` : ''}
                  </div>
                  {it.notes && <div style={{ color: inkMuted, fontSize: 12, marginTop: 4 }}>{it.notes}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
