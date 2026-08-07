import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

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

const TYPE_COLORS = {
  'Court Date': RED,
  'Task': WARNING,
  'Check-In Due': ACCENT,
  'Appointment': GREEN,
  'Reporting Due': WARNING,
  'Program Review': ACCENT,
  'Other': '#7DA6E0',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = dateKey(new Date());

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
    page: { padding: isPhone ? '20px 16px' : '30px', fontFamily: NAV_FONT },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
    title: { color: TEXT, margin: 0, fontSize: 22, fontWeight: 700 },
    addBtn: { padding: '10px 18px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 },
    layout: { display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1.4fr 1fr', gap: 20 },
    calCard: { background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: isPhone ? 12 : 18 },
    monthNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    monthLabel: { color: TEXT, fontSize: 16, fontWeight: 600 },
    navBtn: { background: 'none', border: `0.5px solid ${BORDER}`, color: TEXT_MUTED, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
    weekdayCell: { textAlign: 'center', fontSize: 11, color: TEXT_DIM, fontWeight: 600, padding: '4px 0' },
    card: { background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 18 },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Calendar</h1>
        <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>+ Add Event</button>
      </div>

      {showForm && (
        <div style={{ ...s.calCard, marginBottom: 20 }}>
          <input placeholder="Event Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT }} />
          <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, colorScheme: 'dark' }} />
          <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXT }}>
            <option value="">Select Type</option>
            {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input placeholder="Client Name (optional)" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
            style={{ width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT }} />
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
            {WEEKDAYS.map(w => <div key={w} style={s.weekdayCell}>{isPhone ? w[0] : w}</div>)}
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} />;
              const key = dateKey(new Date(year, month, d));
              const items = itemsByDay[key] || [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDay;
              return (
                <div key={key} onClick={() => setSelectedDay(key)} style={{
                  minHeight: isPhone ? 40 : 56, borderRadius: 8, padding: '4px 5px', cursor: 'pointer',
                  background: isSelected ? 'rgba(91,155,240,0.18)' : isToday ? 'rgba(91,155,240,0.08)' : 'transparent',
                  border: isSelected ? `1px solid ${ACCENT}` : '1px solid transparent',
                }}>
                  <div style={{ fontSize: 12, color: isToday ? ACCENT : TEXT, fontWeight: isToday ? 700 : 400 }}>{d}</div>
                  {items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 3 }}>
                      {items.slice(0, 3).map((it, ii) => (
                        <div key={ii} style={{ width: 5, height: 5, borderRadius: '50%', background: TYPE_COLORS[it.type] || TYPE_COLORS.Other }} />
                      ))}
                      {items.length > 3 && <div style={{ fontSize: 8, color: TEXT_DIM }}>+{items.length - 3}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={s.card}>
          <div style={{ color: TEXT, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ color: TEXT_DIM, fontSize: 12, marginBottom: 14 }}>{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}</div>
          {selectedItems.length === 0 ? (
            <p style={{ color: TEXT_DIM, fontSize: 13 }}>Nothing scheduled this day.</p>
          ) : (
            selectedItems.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i === selectedItems.length - 1 ? 'none' : `0.5px solid ${BORDER}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[it.type] || TYPE_COLORS.Other, marginTop: 5, flexShrink: 0 }} />
                <div>
                  <div style={{ color: TEXT, fontSize: 14, fontWeight: 500 }}>{it.title}</div>
                  <div style={{ color: TEXT_DIM, fontSize: 12, marginTop: 2 }}>
                    {it.type}{it.time ? ` · ${it.time}` : ''}{it.sub ? ` · ${it.sub}` : ''}
                  </div>
                  {it.notes && <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 4 }}>{it.notes}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
