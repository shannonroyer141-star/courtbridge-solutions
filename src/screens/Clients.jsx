import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Clients({ onSelectClient }) {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (data) setClients(data);
  }

  async function handleSave() {
    if (!name) return;
    setSaving(true);
    await supabase.from('clients').insert([{ name, email, phone }]);
    setName(''); setEmail(''); setPhone('');
    setShowForm(false);
    setSaving(false);
    fetchClients();
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Clients</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
          + Add Client
        </button>
      </div>
      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <input placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
          <button onClick={handleSave} disabled={saving} style={{ padding: '12px 25px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
            {saving ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      )}
      {clients.length === 0 ? <p>No clients yet.</p> : clients.map(c => (
        <div key={c.id} onClick={() => onSelectClient && onSelectClient(c.id)}
          style={{ background: 'white', border: '1px solid #ddd', padding: '15px', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer' }}>
          <h3 style={{ margin: 0, color: '#1B3A6B' }}>{c.name || c.client_name}</h3>
          <p style={{ margin: '5px 0 0', color: '#666' }}>{c.email} {c.phone ? `• ${c.phone}` : ''}</p>
        </div>
      ))}
    </div>
  );
}
