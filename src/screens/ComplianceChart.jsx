import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const BLUE = '#1B3A6B';

const S = {
  page: { padding: '32px 36px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { marginBottom: '28px' },
  title: { fontSize: '22px', fontWeight: '700', color: BLUE, margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: '#8A9BB0', margin: 0 },
  card: { background: '#fff', borderRadius: '10px', border: '1px solid #E8EDF4', boxShadow: '0 1px 4px rgba(27,58,107,0.06)', overflow: 'hidden' },
  row: { padding: '16px 20px', borderBottom: '1px solid #F5F7FA' },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  name: { fontSize: '14px', fontWeight: '600', color: '#1E2D3D' },
  sub: { fontSize: '12px', color: '#B0BCC8', marginTop: '2px' },
  pct: { fontSize: '16px', fontWeight: '700' },
  track: { background: '#F0F4FA', borderRadius: '6px', height: '8px', overflow: 'hidden' },
  emptyState: { padding: '48px 20px', textAlign: 'center', color: '#8A9BB0', fontSize: '14px' },
  loading: { padding: '30px', color: '#8A9BB0' },
};

function rateColor(rate) {
  if (rate >= 80) return '#1A7A47';
  if (rate >= 60) return '#D4580A';
  return '#C0392B';
}

export default function ComplianceChart({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCompliance(); }, []);

  async function fetchCompliance() {
    setLoading(true);
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, check_in_frequency_days')
      .eq('provider_id', session.user.id)
      .eq('status', 'active');

    if (!clients || clients.length === 0) { setRows([]); setLoading(false); return; }

    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const results = [];
    for (const client of clients) {
      const freqDays = client.check_in_frequency_days || 1;
      const { data: checkins } = await supabase
        .from('checkins')
        .select('id')
        .eq('client_id', client.id)
        .gte('checked_in_at', since);

      const expected = Math.max(Math.round(30 / freqDays), 1);
      const actual = checkins?.length || 0;
      const rate = Math.min(Math.round((actual / expected) * 100), 100);
      results.push({ id: client.id, name: client.name, actual, expected, rate });
    }

    results.sort((a, b) => a.rate - b.rate);
    setRows(results);
    setLoading(false);
  }

  if (loading) return <div style={S.loading}>Loading compliance chart...</div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Compliance Chart</h1>
        <p style={S.subtitle}>Check-in compliance over the last 30 days, by client</p>
      </div>

      <div style={S.card}>
        {rows.length === 0 ? (
          <div style={S.emptyState}>No active clients yet.</div>
        ) : (
          rows.map(r => (
            <div key={r.id} style={S.row}>
              <div style={S.rowTop}>
                <div>
                  <div style={S.name}>{r.name}</div>
                  <div style={S.sub}>{r.actual} of {r.expected} expected check-ins</div>
                </div>
                <div style={{ ...S.pct, color: rateColor(r.rate) }}>{r.rate}%</div>
              </div>
              <div style={S.track}>
                <div style={{ width: `${r.rate}%`, background: rateColor(r.rate), height: '100%', borderRadius: '6px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
