import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';

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
  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 700, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, marginBottom: 8 }}>SMS Alerts</h1>
      <p style={{ color: TEXT_MUTED, marginBottom: 16, fontSize: 14 }}>Send text message alerts to clients. Requires Twilio credentials in Supabase secrets.</p>

      <div style={{ background: 'rgba(61,111,168,0.12)', border: `0.5px solid ${WARNING}`, borderRadius: 8, padding: 14, marginBottom: 24, fontSize: 13, color: WARNING }}>
        🔧 To activate SMS: Sign up free at <strong>twilio.com</strong> → get Account SID, Auth Token, and a phone number → add them to Supabase Edge Function secrets as <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong>, and <strong>TWILIO_PHONE_NUMBER</strong>.
      </div>

      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 24 }}>
        <h2 style={{ color: TEXT, marginBottom: 16, fontSize: 16 }}>Send SMS</h2>
        <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={inputStyle}>
          <option value="">Select Client *</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `— ${c.phone}` : '(no phone)'}</option>)}
        </select>
        {form.client_id && !client?.phone && (
          <div style={{ background: 'rgba(248,113,113,0.1)', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13, color: RED }}>⚠️ This client has no phone number. Add it in their profile first.</div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {Object.keys(TEMPLATES).map(key => (
            <button key={key} onClick={() => { setForm({...form, message_type: key, message: TEMPLATES[key]}); }}
              style={{ padding: '6px 12px', background: form.message_type === key ? ACCENT : 'rgba(255,255,255,0.04)', color: form.message_type === key ? 'white' : ACCENT, border: `0.5px solid ${ACCENT}`, borderRadius: 20, cursor: 'pointer', fontSize: 12 }}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <NotesWarning />
        <textarea placeholder="Message text... Use [NAME] to insert client's first name." value={form.message} onChange={e => setForm({...form, message: e.target.value})} style={{ ...inputStyle, minHeight: 100, marginBottom: 8 }} />
        <p style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12 }}>{form.message.length} characters {form.message.length > 160 ? '— will send as 2 messages' : ''}</p>
        {status && <div style={{ background: status.includes('✅') ? 'rgba(76,175,125,0.12)' : 'rgba(61,111,168,0.12)', border: `0.5px solid ${status.includes('✅') ? GREEN : WARNING}`, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: status.includes('✅') ? GREEN : WARNING }}>{status}</div>}
        <button onClick={sendSMS} disabled={sending || !form.client_id || !form.message} style={{ width: '100%', padding: 13, background: form.client_id && form.message ? ACCENT : 'rgba(255,255,255,0.08)', color: form.client_id && form.message ? 'white' : TEXT_DIM, border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' }}>
          {sending ? 'Sending...' : '📱 Send SMS'}
        </button>
      </div>

      <h2 style={{ color: TEXT, marginBottom: 16, fontSize: 16 }}>SMS Log</h2>
      {logs.length === 0 ? <p style={{ color: TEXT_MUTED }}>No messages sent yet.</p> : logs.map(l => (
        <div key={l.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 14, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT, fontSize: 13 }}>{l.clients?.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXT_DIM }}>{l.phone_number} • {new Date(l.sent_at).toLocaleString()}</p>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', background: l.status === 'delivered' ? 'rgba(76,175,125,0.15)' : 'rgba(61,111,168,0.15)', color: l.status === 'delivered' ? GREEN : WARNING }}>
              {l.status === 'delivered' ? '✅ Delivered' : l.status === 'pending_configuration' ? '⏳ Pending Setup' : '📤 Sent'}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: TEXT_MUTED }}>{l.message}</p>
        </div>
      ))}
    </div>
  );
}
