import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const TEMPLATES = {
  missed_checkin: {
    label: '⚠️ Missed Check-In',
    subject: 'Important: Missed Check-In Notice',
    body: `Hi [CLIENT NAME],\n\nThis is a reminder that you missed your required check-in on [DATE]. Please check in as soon as possible to stay in compliance with your court-ordered requirements.\n\nIf you are having technical issues with the app, please contact us immediately at [PHONE].\n\nFailure to check in may be reported to your probation officer or the court.\n\nPlease take action today.\n\nCourtBridge Solutions`
  },
  upcoming_court: {
    label: '⚖️ Upcoming Court Date',
    subject: 'Reminder: Upcoming Court Date',
    body: `Hi [CLIENT NAME],\n\nThis is a reminder that you have an upcoming court hearing on [DATE] at [TIME].\n\nCourt: [COURT NAME]\nCourtroom: [COURTROOM]\n\nPlease ensure you arrive on time and bring any required documentation. If you have questions, contact your attorney.\n\nCourtBridge Solutions`
  },
  upcoming_po: {
    label: '👮 PO Visit Reminder',
    subject: 'Reminder: Upcoming Probation Officer Visit',
    body: `Hi [CLIENT NAME],\n\nThis is a reminder that you have a required probation officer visit on [DATE] at [TIME] with [PO NAME].\n\nLocation: [LOCATION]\n\nPlease arrive on time. Missing this visit without prior authorization may result in a violation.\n\nCourtBridge Solutions`
  },
  compliance_warning: {
    label: '🚨 Compliance Warning',
    subject: 'Compliance Warning — Action Required',
    body: `Hi [CLIENT NAME],\n\nWe are reaching out because your compliance record shows you are falling behind on your required check-ins.\n\nRequired check-ins missed: [NUMBER]\nLast check-in: [DATE]\n\nYou must take immediate action to get back on track. Please check in today and contact us to discuss your situation.\n\nThis information may be shared with your probation officer or the court if compliance does not improve.\n\nCourtBridge Solutions`
  },
  general: {
    label: '✉️ General Message',
    subject: '',
    body: ''
  }
};

export default function Messages({ clientId }) {
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(clientId || '');
  const [showCompose, setShowCompose] = useState(false);
  const [template, setTemplate] = useState('general');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('inbox');

  useEffect(() => {
    fetchClients();
    fetchMessages();
  }, []);

  useEffect(() => {
    if (template !== 'general') {
      setSubject(TEMPLATES[template].subject);
      setBody(TEMPLATES[template].body);
    }
  }, [template]);

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name, email').order('name');
    if (data) setClients(data);
  }

  async function fetchMessages() {
    const { data } = await supabase.from('messages').select('*, clients(name)').order('created_at', { ascending: false });
    if (data) setMessages(data);
  }

  async function sendMessage() {
    if (!selectedClient || !subject || !body) {
      setStatus('Please fill in all fields.');
      return;
    }
    const client = clients.find(c => c.id === selectedClient);
    if (!client?.email) {
      setStatus('This client does not have an email address on file.');
      return;
    }
    setSending(true);
    setStatus('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`https://howvgvrrxcpdiqjbnhzn.supabase.co/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          to_email: client.email,
          to_name: client.name,
          subject,
          body,
          client_id: selectedClient,
          message_type: template,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setStatus('✅ Message sent and logged successfully!');
        setSubject('');
        setBody('');
        setTemplate('general');
        setShowCompose(false);
        fetchMessages();
      } else {
        setStatus('Error: ' + result.error);
      }
    } catch (err) {
      setStatus('Error sending message. Please check your Resend API key is configured.');
    }
    setSending(false);
  }

  const client = clients.find(c => c.id === selectedClient);

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Messages</h1>
        <button onClick={() => setShowCompose(!showCompose)}
          style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          ✉️ Compose
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        All messages are sent via email and automatically logged to the client's record.
      </p>

      {showCompose && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '24px' }}>
          <h2 style={{ color: '#1B3A6B', marginBottom: '16px', fontSize: '16px' }}>New Message</h2>

          <label style={{ fontWeight: 'bold', color: '#555', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
            <option value="">Select Client *</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.email ? `— ${c.email}` : '(no email)'}</option>
            ))}
          </select>

          {selectedClient && !client?.email && (
            <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '13px', color: '#721c24' }}>
              ⚠️ This client does not have an email address on file. Add their email in the Clients screen first.
            </div>
          )}

          <label style={{ fontWeight: 'bold', color: '#555', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Template (optional)</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button key={key} onClick={() => setTemplate(key)}
                style={{ padding: '7px 14px', background: template === key ? '#1B3A6B' : 'white', color: template === key ? 'white' : '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' }}>
                {t.label}
              </button>
            ))}
          </div>

          <label style={{ fontWeight: 'bold', color: '#555', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Subject</label>
          <input placeholder="Subject *" value={subject} onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} />

          <label style={{ fontWeight: 'bold', color: '#555', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Message</label>
          <textarea placeholder="Write your message... Replace [BRACKETS] with actual details." value={body} onChange={e => setBody(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', minHeight: '200px', lineHeight: '1.6' }} />

          {status && (
            <div style={{ background: status.includes('✅') ? '#d4edda' : '#fdecea', border: `1px solid ${status.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`, borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '13px', color: status.includes('✅') ? '#155724' : '#721c24' }}>
              {status}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={sendMessage} disabled={sending || !selectedClient || !subject || !body}
              style={{ flex: 2, padding: '13px', background: selectedClient && subject && body ? '#1B3A6B' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
              {sending ? 'Sending...' : '📤 Send Message'}
            </button>
            <button onClick={() => { setShowCompose(false); setStatus(''); }}
              style={{ flex: 1, padding: '13px', background: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setTab('inbox')}
          style={{ padding: '9px 18px', background: tab === 'inbox' ? '#1B3A6B' : 'white', color: tab === 'inbox' ? 'white' : '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          Sent ({messages.length})
        </button>
      </div>

      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</p>
          <p>No messages sent yet. Compose your first message above.</p>
        </div>
      ) : messages.map(m => (
        <div key={m.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B', fontSize: '14px' }}>{m.clients?.name || m.to_name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>{m.to_email}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ background: m.delivered ? '#d4edda' : '#fdecea', color: m.delivered ? '#155724' : '#721c24', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                {m.delivered ? '✅ Delivered' : '❌ Failed'}
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#aaa' }}>{new Date(m.sent_at).toLocaleString()}</p>
            </div>
          </div>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px', color: '#333' }}>{m.subject}</p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#555', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{m.body.length > 200 ? m.body.substring(0, 200) + '...' : m.body}</p>
        </div>
      ))}
    </div>
  );
}
