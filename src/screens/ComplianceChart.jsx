import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const S = {
  page: { padding: '32px 36px', fontFamily: NAV_FONT },
  header: { marginBottom: '28px' },
  title: { fontSize: '22px', fontWeight: '700', color: TEXT, margin: '0 0 4px' },
  subtitle: { fontSize: '13px', color: TEXT_MUTED, margin: 0 },
  card: { background: CARD_BG, borderRadius: '10px', border: `0.5px solid ${BORDER}`, overflow: 'hidden' },
  row: { padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}` },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: 8 },
  name: { fontSize: '14px', fontWeight: '600', color: TEXT },
  sub: { fontSize: '12px', color: TEXT_DIM, marginTop: '2px' },
  pct: { fontSize: '16px', fontWeight: '700' },
  track: { background: 'rgba(255,255,255,0.08)', borderRadius: '6px', height: '8px', overflow: 'hidden' },
  emptyState: { padding: '48px 20px', textAlign: 'center', color: TEXT_MUTED, fontSize: '14px' },
  loading: { padding: '30px', color: TEXT_MUTED },
};

function rateColor(rate) {
  if (rate >= 80) return GREEN;
  if (rate >= 60) return WARNING;
  return RED;
}

export default function ComplianceChart({ session }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchCompliance(); }, []);

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
