import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const BLUE = '#1B3A6B';

const tabBtn = (active) => ({
  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
  background: active ? BLUE : 'transparent', color: active ? '#fff' : '#333',
  fontWeight: active ? 600 : 400, border: 'none',
});

const input = {
  padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px',
  fontFamily: 'inherit', boxSizing: 'border-box',
};

const card = {
  background: 'white', border: '1px solid #eee', borderRadius: '10px', padding: '14px 16px',
  marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '12px',
};

const iconBtn = {
  padding: '6px 10px', background: 'white', color: '#c0392b', border: '1px solid #ddd',
  borderRadius: '6px', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
};

export default function BusinessOrganizer() {
  const [tab, setTab] = useState('tasks');

  return (
    <div style={{ padding: '30px', maxWidth: '900px' }}>
      <h1 style={{ color: BLUE, fontSize: '20px', margin: '0 0 4px' }}>Business Organizer</h1>
      <p style={{ color: '#888', fontSize: '12px', margin: '0 0 20px' }}>Only visible to founder accounts</p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
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

  if (loading) return <div style={{ color: '#888' }}>Loading...</div>;

  const open = tasks.filter(t => !t.done);
  const done = tasks.filter(t => t.done);

  return (
    <div>
      <form onSubmit={addTask} style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <input style={{ ...input, flex: 1 }} placeholder="Add a to-do..." value={draft} onChange={e => setDraft(e.target.value)} />
        <button type="submit" style={{ padding: '10px 18px', background: BLUE, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Add</button>
      </form>

      {open.length === 0 && done.length === 0 && <p style={{ color: '#888' }}>No to-dos yet.</p>}

      {open.map(t => (
        <div key={t.id} style={card}>
          <input type="checkbox" checked={false} onChange={() => toggleDone(t)} style={{ marginTop: '3px' }} />
          <div style={{ flex: 1, fontSize: '14px', color: '#333' }}>{t.content}</div>
          <button style={iconBtn} onClick={() => deleteTask(t.id)}>Delete</button>
        </div>
      ))}

      {done.length > 0 && (
        <>
          <div style={{ fontSize: '12px', color: '#aaa', margin: '18px 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Done</div>
          {done.map(t => (
            <div key={t.id} style={{ ...card, opacity: 0.5 }}>
              <input type="checkbox" checked={true} onChange={() => toggleDone(t)} style={{ marginTop: '3px' }} />
              <div style={{ flex: 1, fontSize: '14px', color: '#333', textDecoration: 'line-through' }}>{t.content}</div>
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

  if (loading) return <div style={{ color: '#888' }}>Loading...</div>;

  return (
    <div>
      <form onSubmit={addNote} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
        <textarea
          style={{ ...input, minHeight: '80px', resize: 'vertical' }}
          placeholder="Jot down a quick note..."
          value={draft}
          onChange={e => setDraft(e.target.value)}
        />
        <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 18px', background: BLUE, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>Add Note</button>
      </form>

      {notes.length === 0 && <p style={{ color: '#888' }}>No notes yet.</p>}

      {notes.map(n => (
        <div key={n.id} style={card}>
          <div style={{ flex: 1, fontSize: '14px', color: '#333', whiteSpace: 'pre-wrap' }}>{n.content}</div>
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

  useEffect(() => { fetchVendors(); }, []);

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

  if (loading) return <div style={{ color: '#888' }}>Loading...</div>;

  return (
    <div>
      <p style={{ color: '#c0392b', fontSize: '12px', marginBottom: '14px' }}>
        Reference info only — account IDs, plan tiers, links. Never store passwords or API keys here; use a password manager for those.
      </p>

      <form onSubmit={addVendor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
        <input style={input} placeholder="Vendor name (e.g. Twilio)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input style={input} placeholder="Account ID / ref (not a password)" value={form.account_ref} onChange={e => setForm({ ...form, account_ref: e.target.value })} />
        <input style={input} placeholder="Plan tier (e.g. Free trial)" value={form.plan_tier} onChange={e => setForm({ ...form, plan_tier: e.target.value })} />
        <input style={input} placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
        <textarea style={{ ...input, gridColumn: '1 / -1', minHeight: '50px' }} placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        <button type="submit" style={{ gridColumn: '1 / -1', padding: '10px 18px', background: BLUE, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', justifySelf: 'start' }}>Add Vendor</button>
      </form>

      {vendors.length === 0 && <p style={{ color: '#888' }}>No vendor accounts logged yet.</p>}

      {vendors.map(v => (
        <div key={v.id} style={card}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>{v.name}</div>
            {v.account_ref && <div style={{ fontSize: '12px', color: '#666' }}>Account: {v.account_ref}</div>}
            {v.plan_tier && <div style={{ fontSize: '12px', color: '#666' }}>Plan: {v.plan_tier}</div>}
            {v.url && <div style={{ fontSize: '12px' }}><a href={v.url} target="_blank" rel="noreferrer">{v.url}</a></div>}
            {v.notes && <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{v.notes}</div>}
          </div>
          <button style={iconBtn} onClick={() => deleteVendor(v.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
