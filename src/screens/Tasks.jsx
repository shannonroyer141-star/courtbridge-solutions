import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, WARNING, RED, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_id: '', title: '', assigned_to: '', due_date: '', priority: 'Medium', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { fetchTasks(); fetchClients(); }, []);

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*, clients(name)').order('due_date', { ascending: true });
    if (data) setTasks(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function toggleComplete(task) {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    fetchTasks();
  }

  async function handleSave() {
    if (!form.title || !form.client_id) return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tasks').insert([{ ...form, provider_id: user.id, completed: false }]);
    if (error) {
      setSaveError('Could not save task: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ client_id: '', title: '', assigned_to: '', due_date: '', priority: 'Medium', notes: '' });
    setShowForm(false);
    setSaving(false);
    fetchTasks();
  }

  const priorityColors = { High: RED, Medium: WARNING, Low: GREEN };
  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Tasks</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Add Task</button>
      </div>
      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={inputStyle}>
            <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id} style={{ background: '#1E2A3A', color: '#fff' }}>{c.name}</option>)}
          </select>
          <input placeholder="Task Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={inputStyle} />
          <input placeholder="Assigned To" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} style={inputStyle} />
          <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} style={inputStyle} />
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={{ ...inputStyle, marginBottom: 15 }}>
            <option style={{ background: '#1E2A3A', color: '#fff' }}>High</option><option style={{ background: '#1E2A3A', color: '#fff' }}>Medium</option><option style={{ background: '#1E2A3A', color: '#fff' }}>Low</option>
          </select>
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving || !form.title || !form.client_id} style={{ padding: '12px 25px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Task'}</button>
        </div>
      )}
      {tasks.filter(t => !t.completed).map(t => (
        <div key={t.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="checkbox" checked={false} onChange={() => toggleComplete(t)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{t.title}</p>
            {t.clients?.name && <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{t.clients.name}</p>}
            {t.assigned_to && <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>→ {t.assigned_to}</p>}
            {t.due_date && <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>Due: {new Date(t.due_date).toLocaleDateString()}</p>}
          </div>
          <span style={{ background: priorityColors[t.priority], color: 'white', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>{t.priority}</span>
        </div>
      ))}
      {tasks.filter(t => t.completed).length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ color: TEXT_MUTED, marginBottom: 12, fontSize: 16 }}>Completed</h2>
          {tasks.filter(t => t.completed).map(t => (
            <div key={t.id} style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 8, display: 'flex', gap: 14, alignItems: 'center', opacity: 0.7 }}>
              <input type="checkbox" checked={true} onChange={() => toggleComplete(t)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <p style={{ margin: 0, color: TEXT_MUTED, textDecoration: 'line-through' }}>{t.title}</p>
            </div>
          ))}
        </div>
      )}
      {tasks.length === 0 && <p style={{ color: TEXT_MUTED }}>No tasks yet.</p>}
    </div>
  );
}
