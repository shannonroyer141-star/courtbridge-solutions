import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function ClientProfile({ clientId }) {
  const [client, setClient] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [courtDates, setCourtDates] = useState([]);
  const [drugTests, setDrugTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) fetchAll();
  }, [clientId]);

  async function fetchAll() {
    setLoading(true);
   

      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('check_ins').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(7),
      supabase.from('court_dates').select('*').eq('user_id', clientId).order('date', { ascending: true }).limit(3),
      supabase.from('drug_tests').select('*').eq('user_id', clientId).order('test_date', { ascending: false }).limit(3),
    ]);
    setClient(c);
    setCheckIns(ci || []);
    setCourtDates(cd || []);
    setDrugTests(dt || []);
    setLoading(false);
  }

  function getStatusColor(status) {
    if (status === 'active') return '#16a34a';
    if (status === 'at_risk') return '#dc2626';
    return '#d97706';
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading client...</div>;
  if (!client) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>No client selected.</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: 'bold' }}>
          {(client.full_name || client.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1e3a5f' }}>{client.full_name || client.email}</h2>
          <span style={{ background: getStatusColor(client.status), color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
            {client.status || 'Pending'}
          </span>
        </div>
      </div>

      {/* Check-In Streak */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#1e3a5f', fontSize: '15px' }}>Check-In History (Last 7)</h3>
        {checkIns.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No check-ins recorded.</p> : (
          checkIns.map(ci => (
            <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>{new Date(ci.created_at).toLocaleDateString()}</span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>{ci.location || 'No location'}</span>
              <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>✓ Checked In</span>
            </div>
          ))
        )}
      </div>

      {/* Upcoming Court Dates */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#1e3a5f', fontSize: '15px' }}>Upcoming Court Dates</h3>
        {courtDates.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No upcoming court dates.</p> : (
          courtDates.map(cd => (
            <div key={cd.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>{new Date(cd.date).toLocaleDateString()}</span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>{cd.court_name || 'Court'}</span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>{cd.type || 'Hearing'}</span>
            </div>
          ))
        )}
      </div>

      {/* Drug Tests */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#1e3a5f', fontSize: '15px' }}>Recent Drug Tests</h3>
        {drugTests.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No drug tests recorded.</p> : (
          drugTests.map(dt => (
            <div key={dt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>{new Date(dt.test_date).toLocaleDateString()}</span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>{dt.substance || 'Panel'}</span>
              <span style={{ background: dt.result === 'negative' ? '#dcfce7' : '#fee2e2', color: dt.result === 'negative' ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                {dt.result || 'Pending'}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>📩 Send Message</button>
        <button style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>🚨 Create Alert</button>
        <button style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>📄 View Reports</button>
      </div>

    </div>
  );
}