import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Alerts() {
  const [clients, setClients] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [activeTab, setActiveTab] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [actionDone, setActionDone] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // Only fetch clients belonging to this provider
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('provider_id', user.id);

    // Only fetch check-ins for this provider's clients
    const clientIds = (clientData || []).map(c => c.id);
    let checkInData = [];
    if (clientIds.length > 0) {
      const { data } = await supabase
        .from('checkins')
        .select('*')
        .in('client_id', clientIds)
        .order('checked_in_at', { ascending: false });
      checkInData = data || [];
    }

    setClients(clientData || []);
    setCheckIns(checkInData);
    setLoading(false);
  }

  function getClientStatus(client, windowHours) {
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const recent = checkIns.find(c => c.client_id === client.id && new Date(c.checked_in_at) >= cutoff);
    return recent ? 'compliant' : 'missed';
  }

  function getWindowHours(tab) {
    if (tab === '24h') return 24;
    if (tab === '48h') return 48;
    return 72;
  }

  async function handleContactClient(client) {
    setActionLoading(prev => ({ ...prev, [client.id]: true }));
    await supabase.from('contact_log').insert([{ client_id: client.id, provider_id: currentUser?.id, contact_type: 'Missed Check-In Follow-Up', initiated_by: 'provider', outcome: 'Pending', notes: 'Auto: missed 24hr window. Logged ' + new Date().toLocaleString() }]);
    await supabase.from('alerts').insert([{ client_id: client.id, provider_id: currentUser?.id, alert_type: 'missed_checkin', message: client.name + ' missed check-in (24hr). Contact attempted.', resolved: false }]);
    setActionLoading(prev => ({ ...prev, [client.id]: false }));
    setActionDone(prev => ({ ...prev, [client.id]: 'contacted' }));
  }

  async function handleNotifyPO(client) {
    setActionLoading(prev => ({ ...prev, [client.id]: true }));
    await supabase.from('contact_log').insert([{ client_id: client.id, provider_id: currentUser?.id, contact_type: 'PO Notification - Missed Check-In', initiated_by: 'provider', outcome: 'Notified', notes: 'Auto: missed 48hr window. PO notified ' + new Date().toLocaleString() }]);
    await supabase.from('alerts').insert([{ client_id: client.id, provider_id: currentUser?.id, alert_type: 'missed_checkin', message: client.name + ' missed check-in (48hr). PO notified.', resolved: false }]);
    setActionLoading(prev => ({ ...prev, [client.id]: false }));
    setActionDone(prev => ({ ...prev, [client.id]: 'notified' }));
  }

  async function handleFlagForCourt(client) {
    setActionLoading(prev => ({ ...prev, [client.id]: true }));
    await supabase.from('violation_reports').insert([{ client_id: client.id, provider_id: currentUser?.id, violation_type: 'Missed Check-In', description: client.name + ' has not checked in within 72 hours.', missed_checkins: 1, recommended_action: 'Court notification and possible violation hearing', status: 'draft' }]);
    await supabase.from('alerts').insert([{ client_id: client.id, provider_id: currentUser?.id, alert_type: 'missed_checkin', message: client.name + ' missed check-in (72hr). Violation report created.', resolved: false }]);
    setActionLoading(prev => ({ ...prev, [client.id]: false }));
    setActionDone(prev => ({ ...prev, [client.id]: 'flagged' }));
  }

  const tabs = [
    { key: '24h', label: '24 Hours', urgency: 'Contact client immediately', action: 'Contact Client', handler: handleContactClient, doneLabel: 'Contacted', borderColor: '#F39C12', bgColor: '#FEF9EC', badgeBg: '#FEF3CD', badgeText: '#B7770D', buttonBg: '#F39C12' },
    { key: '48h', label: '48 Hours', urgency: 'Notify probation officer', action: 'Notify PO', handler: handleNotifyPO, doneLabel: 'PO Notified', borderColor: '#E67E22', bgColor: '#FDF0E8', badgeBg: '#FCDDC7', badgeText: '#9A4B10', buttonBg: '#E67E22' },
    { key: '72h', label: '72 Hours', urgency: 'Contact court - possible violation', action: 'Flag for Court', handler: handleFlagForCourt, doneLabel: 'Flagged', borderColor: '#C0392B', bgColor: '#FDECEA', badgeBg: '#F5C6CB', badgeText: '#7B1A14', buttonBg: '#C0392B' },
  ];

  const activeConfig = tabs.find(t => t.key === activeTab);
  const windowHours = getWindowHours(activeTab);
  const missedClients = clients.filter(c => getClientStatus(c, windowHours) === 'missed');
  const compliantClients = clients.filter(c => getClientStatus(c, windowHours) === 'compliant');

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '8px' }}>Alerts</h1>
      <p style={{ color: '#8A9BB0', marginBottom: '24px', marginTop: '10px' }}>Client check-in compliance — take action directly from this screen</p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 22px', borderRadius: '8px', border: activeTab === tab.key ? '2px solid ' + tab.borderColor : '2px solid #e8ecf2', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', background: activeTab === tab.key ? tab.borderColor : 'white', color: activeTab === tab.key ? 'white' : '#555' }}>
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? <p style={{ color: '#8A9BB0' }}>Loading...</p> : (
        <>
          {missedClients.length === 0 && (
            <div style={{ background: '#eafaf1', border: '1px solid #a9dfbf', borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', fontWeight: 'bold', color: '#1e8449', fontSize: '15px', textAlign: 'center' }}>
              All clients have checked in within the last {activeTab}.
            </div>
          )}
          {missedClients.length > 0 && (
            <div style={{ background: activeConfig.bgColor, border: '1px solid ' + activeConfig.borderColor, borderLeft: '5px solid ' + activeConfig.borderColor, borderRadius: '10px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🚨</span>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: activeConfig.badgeText, fontSize: '15px' }}>{missedClients.length} client{missedClients.length > 1 ? 's have' : ' has'} not checked in within {activeTab}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: activeConfig.badgeText }}>Required action: {activeConfig.urgency}</p>
              </div>
            </div>
          )}
          {missedClients.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <p style={{ fontWeight: 'bold', color: '#2C3E50', marginBottom: '10px', fontSize: '13px', textTransform: 'uppercase' }}>Missed — {missedClients.length} client{missedClients.length > 1 ? 's' : ''}</p>
              {missedClients.map(client => (
                <div key={client.id} style={{ background: activeConfig.bgColor, border: '1px solid ' + activeConfig.borderColor, borderLeft: '5px solid ' + activeConfig.borderColor, borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2C3E50', fontSize: '15px' }}>{client.name || 'Unknown'}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: activeConfig.badgeText }}>{activeConfig.urgency}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: activeConfig.badgeBg, color: activeConfig.badgeText, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>MISSED</span>
                    {actionDone[client.id] ? (
                      <span style={{ background: '#eafaf1', color: '#1e8449', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>{activeConfig.doneLabel}</span>
                    ) : (
                      <button onClick={() => activeConfig.handler(client)} disabled={actionLoading[client.id]} style={{ background: actionLoading[client.id] ? '#aaa' : activeConfig.buttonBg, color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {actionLoading[client.id] ? 'Saving...' : activeConfig.action}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {compliantClients.length > 0 && (
            <div>
              <p style={{ fontWeight: 'bold', color: '#2C3E50', marginBottom: '10px', fontSize: '13px', textTransform: 'uppercase' }}>Compliant — {compliantClients.length} client{compliantClients.length > 1 ? 's' : ''}</p>
              {compliantClients.map(client => (
                <div key={client.id} style={{ background: '#eafaf1', border: '1px solid #a9dfbf', borderLeft: '5px solid #27AE60', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#2C3E50', fontSize: '15px' }}>{client.name || 'Unknown'}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#1e8449' }}>Checked in within {activeTab}</p>
                  </div>
                  <span style={{ background: '#d5f5e3', color: '#1e8449', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>COMPLIANT</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}