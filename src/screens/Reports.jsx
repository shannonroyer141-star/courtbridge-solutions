import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchClients(); }, []);

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').order('name');
    if (data) setClients(data);
  }

  async function fetchCheckins() {
    if (!selectedClient) return;
    setLoading(true);
    const { data } = await supabase.from('Check_ins').select('*')
      .eq('client_id', selectedClient).order('created_at', { ascending: false });
    if (data) setCheckins(data);
    setLoading(false);
  }

  function printReport() { window.print(); }

  function exportCSV() {
    if (!checkins.length) return;
    const headers = ['Date', 'Time', 'Latitude', 'Longitude', 'Location Valid'];
    const rows = checkins.map(c => [
      new Date(c.check_in_time || c.created_at).toLocaleDateString(),
      new Date(c.check_in_time || c.created_at).toLocaleTimeString(),
      c.latitude || '', c.longitude || '',
      c.location_valid === false ? 'FLAGGED' : 'Valid'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report.csv`;
    a.click();
  }

  const client = clients.find(c => c.id === selectedClient);

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '30px' }}>Court-Ready Report</h1>
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '15px' }}>
          <option value="">-- Select a client --</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.client_name}</option>)}
        </select>
        <button onClick={fetchCheckins} style={{ padding: '12px 25px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}>Load Report</button>
        {checkins.length > 0 && <>
          <button onClick={printReport} style={{ padding: '12px 25px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', marginRight: '10px' }}>🖨️ Print PDF</button>
          <button onClick={exportCSV} style={{ padding: '12px 25px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }}>⬇️ Export CSV</button>
        </>}
      </div>
      {loading && <p>Loading...</p>}
      {checkins.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '30px' }}>
          <div style={{ borderBottom: '3px solid #1B3A6B', paddingBottom: '20px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1B3A6B', margin: 0 }}>CourtBridge Solutions</h2>
            <p style={{ color: '#666', margin: '5px 0 0' }}>Compliance Report — Generated {new Date().toLocaleString()}</p>
          </div>
          <p><strong>Client:</strong> {client?.name || client?.client_name}</p>
          <p><strong>Total Check-Ins:</strong> {checkins.length}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#1B3A6B', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Latitude</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Longitude</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{new Date(c.check_in_time || c.created_at).toLocaleString()}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{c.latitude || '—'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{c.longitude || '—'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #eee', color: c.location_valid === false ? '#E74C3C' : '#27AE60', fontWeight: 'bold' }}>{c.location_valid === false ? '⚠️ Flagged' : '✅ Valid'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
