import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function SMSAlerts() {
  const [logs, setLogs] = useState([]);
  const [clients, setClients] = useState([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ client_id: '', message: '', message_type: 'custom' });

  const TEMPLATES = {
    checkin_reminder: 'Hi [NAME], this is a reminder from CourtBridge Solutions. Your check-in is due today. Please open the app and check in now to stay compliant.',
    missed_checkin: 'IMPORTANT: Hi [NAME], you have missed a required check-in. Please check in immediately or contact your provider. Failure to comply may be reported to the court.',
    upcoming_po: 'Reminder from CourtBridge Solutions: Hi [NAME], you have a PO visit scheduled. Please confirm with your probation officer and arrive on time.',
    upcoming_court: 'CourtBridge Solutions: Hi [NAME], you have a court date coming up. Please prepare any required documents and arrive on time.',
    custom: ''
  };

  useEffect(() => { fetchLogs(); fetchClients(); }, []);

  async function fetchLogs() {
    const { data } = await supabase.from('sms_logs').select('*, clients(name)').order('sent_at', { ascending: false }).limit(50);
    if (data) setLogs(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name, phone').order('name');
    if (data) setClients(data);
  }

  async function sendSMS() {
    const client = clients.find(c => c.id === form.client_id);
    if (!client?.phone) { setStatus('This client does not have a phone number on file.'); return; }
    setSending(true);
    setStatus('');

    const messageText = form.message.replace('[NAME]', client.name.split(' ')[0]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://howvgvrrxcpdiqjbnhzn.supabase.co/functions/v1/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ to: client.phone, message: messageText, client_id: form.client_id }),
      });
      const result = await response.json();
      if (result.success) {
        setStatus('✅ SMS sent to ' + client.name);
        setForm({ client_id: '', message: '', message_type: 'custom' });
        fetchLogs();
      } else {
        setStatus('SMS not yet configured. Add your Twilio credentials to Supabase secrets to enable SMS. Message logged.');
        await supabase.from('sms_logs').insert([{ client_id: form.client_id, phone_number: client.phone, message: messageText, status: 'pending_configuration' }]);
        fetchLogs();
      }
    } catch (err) {
      setStatus('SMS coming in Phase 2. Add Twilio credentials to enable. Message has been logged.');
      await supabase.from('sms_logs').insert([{ client_id: form.client_id, phone_number: client.phone, message: messageText, status: 'pending_configuration' }]);
      fetchLogs();
    }
    setSending(false);
  }

  const client = clients.find(c => c.id === form.client_id);

  return (
    <div style={{ padding: '30px', maxWidth: '700px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '8px' }}>SMS Alerts</h1>
      <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>Send text message alerts to clients. Requires Twilio credentials in Supabase secrets.</p>

      <div style={{ background: '#fff3cd', border: '1px solid #F39C12', borderRadius: '8px', padding: '14px', marginBottom: '24px', fontSize: '13px', color: '#856404' }}>
        🔧 To activate SMS: Sign up free at <strong>twilio.com</strong> → get Account SID, Auth Token, and a phone number → add them to Supabase Edge Function secrets as <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong>, and <strong>TWILIO_PHONE_NUMBER</strong>.
      </div>

      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '24px' }}>
        <h2 style={{ color: '#1B3A6B', marginBottom: '16px', fontSize: '16px' }}>Send SMS</h2>
        <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
          <option value="">Select Client *</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : '(no phone)'}</option>)}
        </select>
        {form.client_id && !client?.phone && (
          <div style={{ background: '#fdecea', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '13px', color: '#721c24' }}>⚠️ This client has no phone number. Add it in their profile first.</div>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {Object.keys(TEMPLATES).map(key => (
            <button key={key} onClick={() => { setForm({...form, message_type: key, message: TEMPLATES[key]}); }}
              style={{ padding: '6px 12px', background: form.message_type === key ? '#1B3A6B' : 'white', color: form.message_type === key ? 'white' : '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' }}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <textarea placeholder="Message text... Use [NAME] to insert client's first name." value={form.message} onChange={e => setForm({...form, message: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', minHeight: '100px' }} />
        <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>{form.message.length} characters {form.message.length > 160 ? '— will send as 2 messages' : ''}</p>
        {status && <div style={{ background: status.includes('✅') ? '#d4edda' : '#fff3cd', border: `1px solid ${status.includes('✅') ? '#c3e6cb' : '#F39C12'}`, borderRadius: '8px', padding: '12px', marginBottom: '12px', fontSize: '13px', color: status.includes('✅') ? '#155724' : '#856404' }}>{status}</div>}
        <button onClick={sendSMS} disabled={sending || !form.client_id || !form.message} style={{ width: '100%', padding: '13px', background: form.client_id && form.message ? '#1B3A6B' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
          {sending ? 'Sending...' : '📱 Send SMS'}
        </button>
      </div>

      <h2 style={{ color: '#1B3A6B', marginBottom: '16px', fontSize: '16px' }}>SMS Log</h2>
      {logs.length === 0 ? <p style={{ color: '#666' }}>No messages sent yet.</p> : logs.map(l => (
        <div key={l.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B', fontSize: '13px' }}>{l.clients?.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>{l.phone_number} • {new Date(l.sent_at).toLocaleString()}</p>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: l.status === 'delivered' ? '#d4edda' : '#fff3cd', color: l.status === 'delivered' ? '#155724' : '#856404' }}>
              {l.status === 'delivered' ? '✅ Delivered' : l.status === 'pending_configuration' ? '⏳ Pending Setup' : '📤 Sent'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#444' }}>{l.message}</p>
        </div>
      ))}
    </div>
  );
}
