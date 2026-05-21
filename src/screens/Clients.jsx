import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newClient, setNewClient] = useState({ client_name: '', email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    const { data, error } = await supabase
      .from('Clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setClients(data);
  }

  async function addClient() {
    setLoading(true);
    const { error } = await supabase
      .from('Clients')
      .insert({ client_name: newClient.client_name, email: newClient.email });

    if (!error) {
      setNewClient({ client_name: '', email: '' });
      setShowForm(false);
      fetchClients();
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "#1B3A6B", margin: 0 }}>Clients</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ background: "#1B3A6B", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
          + Add Client
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#f4f6f9", padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
          <h3 style={{ color: "#1B3A6B", marginTop: 0 }}>New Client</h3>
          <input
            placeholder="Full Name"
            value={newClient.client_name}
            onChange={e => setNewClient({ ...newClient, client_name: e.target.value })}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" }}
          />
          <input
            placeholder="Email"
            value={newClient.email}
            onChange={e => setNewClient({ ...newClient, email: e.target.value })}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ddd", boxSizing: "border-box" }}
          />
          <button onClick={addClient} disabled={loading} style={{ background: "#2ECC71", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
            {loading ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      )}

      {clients.length === 0 ? (
        <p>No clients yet.</p>
      ) : (
        clients.map(client => (
          <div key={client.id} style={{ background: "white", border: "1px solid #ddd", padding: "15px", borderRadius: "10px", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, color: "#1B3A6B" }}>{client.client_name}</h3>
            <p style={{ margin: 0, color: "#666" }}>{client.email}</p>
          </div>
        ))
      )}
    </div>
  );
}