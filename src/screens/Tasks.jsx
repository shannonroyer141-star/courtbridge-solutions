import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', assigned_to: '', due_date: '', priority: 'Medium', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
    if (data) setTasks(data);
  }

  async function toggleComplete(task) {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    fetchTasks();
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('tasks').insert([{ ...form, completed: false }]);
    setForm({ title: '', assigned_to: '', due_date: '', priority: 'Medium', notes: '' });
    setShowForm(false);
    setSaving(false);
    fetchTasks();
  }

  const priorityColors = { High: '#E74C3C', Medium: '#F39C12', Low: '#27AE60' };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Tasks</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Add Task</button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <input placeholder="Task Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input placeholder="Assigned To" value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px' }}>{saving ? 'Saving...' : 'Save Task'}</button>
        </div>
      )}
      {tasks.filter(t => !t.completed).map(t => (
        <div key={t.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'center' }}>
          <input type="checkbox" checked={false} onChange={() => toggleComplete(t)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{t.title}</p>
            {t.assigned_to && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>→ {t.assigned_to}</p>}
            {t.due_date && <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#888' }}>Due: {new Date(t.due_date).toLocaleDateString()}</p>}
          </div>
          <span style={{ background: priorityColors[t.priority], color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>{t.priority}</span>
        </div>
      ))}
      {tasks.filter(t => t.completed).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ color: '#888', marginBottom: '12px', fontSize: '16px' }}>Completed</h2>
          {tasks.filter(t => t.completed).map(t => (
            <div key={t.id} style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: '10px', padding: '14px', marginBottom: '8px', display: 'flex', gap: '14px', alignItems: 'center', opacity: 0.7 }}>
              <input type="checkbox" checked={true} onChange={() => toggleComplete(t)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <p style={{ margin: 0, color: '#888', textDecoration: 'line-through' }}>{t.title}</p>
            </div>
          ))}
        </div>
      )}
      {tasks.length === 0 && <p style={{ color: '#666' }}>No tasks yet.</p>}
    </div>
  );
}
