import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, TEXT, TEXT_MUTED, BORDER, NAV_FONT } from '../theme';
import { logLocationAccess } from '../lib/locationAccessLog';

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
    const { data } = await supabase.from('checkins').select('*')
      .eq('client_id', selectedClient).order('checked_in_at', { ascending: false });
    if (data) setCheckins(data);
    setLoading(false);
  }

  function printReport() {
    logLocationAccess('exported_report', { clientId: selectedClient, checkinCount: checkins.length });
    window.print();
  }

  function exportCSV() {
    if (!checkins.length) return;
    logLocationAccess('exported_report', { clientId: selectedClient, checkinCount: checkins.length });
    const headers = ['Date', 'Time', 'Latitude', 'Longitude'];
    const rows = checkins.map(c => [
      new Date(c.checked_in_at).toLocaleDateString(),
      new Date(c.checked_in_at).toLocaleTimeString(),
      c.latitude || '', c.longitude || ''
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
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, marginBottom: 30 }}>Court-Ready Report</h1>
      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
          style={{ width: '100%', padding: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, fontSize: 16, marginBottom: 15, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }}>
          <option value="">-- Select a client --</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.client_name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={fetchCheckins} style={{ padding: '12px 25px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>Load Report</button>
          {checkins.length > 0 && <>
            <button onClick={printReport} style={{ padding: '12px 25px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>🖨️ Print PDF</button>
            <button onClick={exportCSV} style={{ padding: '12px 25px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>⬇️ Export CSV</button>
          </>}
        </div>
      </div>
      {loading && <p style={{ color: TEXT_MUTED }}>Loading...</p>}
      {checkins.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 12, padding: 30, overflowX: 'auto' }}>
          <div style={{ borderBottom: '3px solid #1B3A6B', paddingBottom: 20, marginBottom: 20 }}>
            <h2 style={{ color: '#1B3A6B', margin: 0 }}>CourtBridge Solutions</h2>
            <p style={{ color: '#666', margin: '5px 0 0' }}>Compliance Report — Generated {new Date().toLocaleString()}</p>
          </div>
          <p style={{ color: '#222' }}><strong>Client:</strong> {client?.name || client?.client_name}</p>
          <p style={{ color: '#222' }}><strong>Total Check-Ins:</strong> {checkins.length}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
            <thead>
              <tr style={{ background: '#1B3A6B', color: 'white' }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Date & Time</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Latitude</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Longitude</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? '#f9f9f9' : 'white' }}>
                  <td style={{ padding: 12, borderBottom: '1px solid #eee', color: '#222' }}>{new Date(c.checked_in_at).toLocaleString()}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #eee', color: '#222' }}>{c.latitude || '—'}</td>
                  <td style={{ padding: 12, borderBottom: '1px solid #eee', color: '#222' }}>{c.longitude || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
