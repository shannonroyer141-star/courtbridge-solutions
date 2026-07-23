import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const tabBtn = (active) => ({
  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
  background: active ? ACCENT : 'transparent', color: active ? '#fff' : TEXT_MUTED,
  fontWeight: active ? 600 : 400, border: 'none',
});

const input = {
  padding: '10px 12px', borderRadius: '8px', border: `0.5px solid ${BORDER}`, fontSize: '14px',
  fontFamily: 'inherit', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT,
};

const card = {
  background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: '10px', padding: '14px 16px',
  marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap',
};

const iconBtn = {
  padding: '6px 10px', background: 'rgba(255,255,255,0.04)', color: RED, border: `0.5px solid ${BORDER}`,
  borderRadius: '6px', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
};

export default function BusinessOrganizer() {
  const [tab, setTab] = useState('tasks');

  return (
    <div style={{ padding: 30, maxWidth: 900, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, fontSize: 20, margin: '0 0 4px' }}>Business Organizer</h1>
      <p style={{ color: TEXT_DIM, fontSize: 12, margin: '0 0 20px' }}>Only visible to founder accounts</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={tabBtn(tab === 'tasks')} onClick={() => setTab('tasks')}>To-Dos</button>
        <button style={tabBtn(tab === 'notes')} onClick={() => setTab('notes')}>Notes</button>
        <button style={tabBtn(tab === 'vendors')} onClick={() => setTab('vendors')}>Vendor Accounts</button>
      </div>

      {tab === 'tasks' && <TasksTab />}
      {tab === 'notes' && <NotesTab />}
      {tab === 'vendors' && <VendorsTab />}
    </div>
  );
}

function TasksTab() {
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    const { data } = await supabase.from('founder_tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  }

  async function addTask(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    await supabase.from('founder_tasks').insert({ content: draft.trim() });
    setDraft('');
    fetchTasks();
  }

  async function toggleDone(task) {
    await supabase.from('founder_tasks').update({ done: !task.done }).eq('id', task.id);
    fetchTasks();
  }

  async function deleteTask(id) {
    await supabase.from('founder_tasks').delete().eq('id', id);
    fetchTasks();
  }

  if (loading) return <div style={{ color: TEXT_MUTED }}>Loading...</div>;

  const open = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div>
      <form onSubmit={addTask} style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <input style={{ ...input, flex: 1, minWidth: 160 }} placeholder="Add a to-do..." value={draft} onChange={e => setDraft(e.target.value)} />
        <button type="submit" style={{ padding: '10px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Add</button>
      </form>

      {open.length === 0 && done.length === 0 && <p style={{ color: TEXT_MUTED }}>No to-dos yet.</p>}

      {open.map(t => (
        <div key={t.id} style={card}>
          <input type="checkbox" checked={false} onChange={() => toggleDone(t)} style={{ marginTop: 3 }} />
          <div style={{ flex: 1, fontSize: 14, color: TEXT }}>{t.content}</div>
          <button style={iconBtn} onClick={() => deleteTask(t.id)}>Delete</button>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: TEXT_DIM, margin: '18px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Done</div>
          {done.map(t => (
            <div key={t.id} style={{ ...card, opacity: 0.5 }}>
              <input type="checkbox" checked={true} onChange={() => toggleDone(t)} style={{ marginTop: 3 }} />
              <div style={{ flex: 1, fontSize: 14, color: TEXT, textDecoration: 'line-through' }}>{t.content}</div>
              <button style={iconBtn} onClick={() => deleteTask(t.id)}>Delete</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function NotesTab() {
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotes(); }, []);

  async function fetchNotes() {
    setLoading(true);
    const { data } = await supabase.from('founder_notes').select('*').order('created_at', { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  }

  async function addNote(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    await supabase.from('founder_notes').insert({ content: draft.trim() });
    setDraft('');
    fetchNotes();
  }

  async function deleteNote(id) {
    await supabase.from('founder_notes').delete().eq('id', id);
    fetchNotes();
  }

  if (loading) return <div style={{ color: TEXT_MUTED }}>Loading...</div>;

  return (
    <div>
      <form onSubmit={addNote} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
        <textarea
          style={{ ...input, minHeight: 80, resize: 'vertical' }}
          placeholder="Jot down a quick note..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Add Note</button>
      </form>

      {notes.length === 0 && <p style={{ color: TEXT_MUTED }}>No notes yet.</p>}

      {notes.map(n => (
        <div key={n.id} style={card}>
          <div style={{ flex: 1, fontSize: 14, color: TEXT, whiteSpace: 'pre-wrap' }}>{n.content}</div>
          <button style={iconBtn} onClick={() => deleteNote(n.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

function VendorsTab() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', account_ref: '', plan_tier: '', url: '', notes: '' });
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => { fetchVendors(); }, []);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = width < 640;

  async function fetchVendors() {
    setLoading(true);
    const { data } = await supabase.from('founder_vendor_accounts').select('*').order('name');
    if (data) setVendors(data);
    setLoading(false);
  }

  async function addVendor(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await supabase.from('founder_vendor_accounts').insert(form);
    setForm({ name: '', account_ref: '', plan_tier: '', url: '', notes: '' });
    fetchVendors();
  }

  async function deleteVendor(id) {
    await supabase.from('founder_vendor_accounts').delete().eq('id', id);
    fetchVendors();
  }

  if (loading) return <div style={{ color: TEXT_MUTED }}>Loading...</div>;

  return (
    <div>
      <p style={{ color: RED, fontSize: 12, marginBottom: 14 }}>
        Reference info only — account IDs, plan tiers, links. Never store passwords or API keys here; use a password manager for those.
      </p>

      <form onSubmit={addVendor} style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 18 }}>
        <input style={input} placeholder="Vendor name (e.g. Twilio)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input style={input} placeholder="Account ID / ref (not a password)" value={form.account_ref} onChange={e => setForm({ ...form, account_ref: e.target.value })} />
        <input style={input} placeholder="Plan tier (e.g. Free trial)" value={form.plan_tier} onChange={e => setForm({ ...form, plan_tier: e.target.value })} />
        <input style={input} placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        <textarea style={{ ...input, gridColumn: isPhone ? 'auto' : '1 / -1', minHeight: 50 }} placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit" style={{ gridColumn: isPhone ? 'auto' : '1 / -1', padding: '10px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', justifySelf: 'start' }}>Add Vendor</button>
      </form>

      {vendors.length === 0 && <p style={{ color: TEXT_MUTED }}>No vendor accounts logged yet.</p>}

      {vendors.map(v => (
        <div key={v.id} style={card}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: TEXT, fontSize: 14 }}>{v.name}</div>
            {v.account_ref && <div style={{ fontSize: 12, color: TEXT_MUTED }}>Account: {v.account_ref}</div>}
            {v.plan_tier && <div style={{ fontSize: 12, color: TEXT_MUTED }}>Plan: {v.plan_tier}</div>}
            {v.url && <div style={{ fontSize: 12 }}><a href={v.url} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>{v.url}</a></div>}
            {v.notes && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 4 }}>{v.notes}</div>}
          </div>
          <button style={iconBtn} onClick={() => deleteVendor(v.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
