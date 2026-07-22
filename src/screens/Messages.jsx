import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const BLUE = '#1B3A6B';

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
  const [activeThreadClientId, setActiveThreadClientId] = useState(clientId || null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

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
    const { data } = await supabase.from('messages').select('*, clients(name, email)').order('created_at', { ascending: true });
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

  async function sendReply(client) {
    if (!replyText.trim()) return;
    setReplySending(true);
    try {
      if (client?.email) {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`https://howvgvrrxcpdiqjbnhzn.supabase.co/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({
            to_email: client.email,
            to_name: client.name,
            subject: 'Message from your provider',
            body: replyText.trim(),
            client_id: client.id,
            message_type: 'reply',
          }),
        });
      } else {
        await supabase.from('messages').insert({
          client_id: client.id,
          subject: 'Message from your provider',
          body: replyText.trim(),
          sender_role: 'provider',
          message_type: 'reply',
          delivered: true,
        });
      }
      setReplyText('');
      fetchMessages();
    } finally {
      setReplySending(false);
    }
  }

  const client = clients.find(c => c.id === selectedClient);

  const threadsByClient = messages.reduce((acc, m) => {
    if (!m.client_id) return acc;
    if (!acc[m.client_id]) acc[m.client_id] = [];
    acc[m.client_id].push(m);
    return acc;
  }, {});

  const threadList = Object.entries(threadsByClient).map(([cid, msgs]) => {
    const last = msgs[msgs.length - 1];
    const hasUrgent = msgs.some(m => m.is_urgent && m.sender_role === 'client');
    return { clientId: cid, clientName: last.clients?.name || 'Unknown', clientEmail: last.clients?.email, last, hasUrgent, count: msgs.length };
  }).sort((a, b) => {
    if (a.hasUrgent !== b.hasUrgent) return a.hasUrgent ? -1 : 1;
    return new Date(b.last.created_at) - new Date(a.last.created_at);
  });

  const activeThread = activeThreadClientId ? threadsByClient[activeThreadClientId] || [] : [];
  const activeThreadMeta = threadList.find(t => t.clientId === activeThreadClientId);

  return (
    <div style={{ padding: '30px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: BLUE, margin: 0 }}>Messages</h1>
        <button onClick={() => setShowCompose(!showCompose)}
          style={{ padding: '10px 20px', background: BLUE, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          ✉️ Compose
        </button>
      </div>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Two-way messages with your clients — replies send by email and are logged automatically.
      </p>

      {showCompose && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '24px' }}>
          <h2 style={{ color: BLUE, marginBottom: '16px', fontSize: '16px' }}>New Message</h2>

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
                style={{ padding: '7px 14px', background: template === key ? BLUE : 'white', color: template === key ? 'white' : BLUE, border: `1px solid ${BLUE}`, borderRadius: '20px', cursor: 'pointer', fontSize: '12px' }}>
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
              style={{ flex: 2, padding: '13px', background: selectedClient && subject && body ? BLUE : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
              {sending ? 'Sending...' : '📤 Send Message'}
            </button>
            <button onClick={() => { setShowCompose(false); setStatus(''); }}
              style={{ flex: 1, padding: '13px', background: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {threadList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666', background: 'white', border: '1px solid #ddd', borderRadius: '12px' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</p>
          <p>No messages yet. Compose your first message above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '280px', flexShrink: 0, background: 'white', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
            {threadList.map(t => (
              <div key={t.clientId} onClick={() => setActiveThreadClientId(t.clientId)}
                style={{
                  padding: '14px 16px', borderBottom: '1px solid #eee', cursor: 'pointer',
                  background: activeThreadClientId === t.clientId ? '#F0F4FA' : 'white',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: BLUE }}>{t.clientName}</span>
                  {t.hasUrgent && (
                    <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>URGENT</span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.last.sender_role === 'client' ? 'Them: ' : 'You: '}{t.last.body}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#aaa' }}>{new Date(t.last.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, background: 'white', border: '1px solid #ddd', borderRadius: '12px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            {!activeThreadClientId ? (
              <div style={{ margin: 'auto', color: '#888', fontSize: '14px' }}>Select a conversation to view it</div>
            ) : (
              <>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontWeight: 'bold', color: BLUE }}>
                  {activeThreadMeta?.clientName}
                </div>
                <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                  {activeThread.map(m => (
                    <div key={m.id} style={{
                      alignSelf: m.sender_role === 'client' ? 'flex-start' : 'flex-end',
                      maxWidth: '75%',
                      background: m.sender_role === 'client' ? '#F5F6F8' : BLUE,
                      color: m.sender_role === 'client' ? '#222' : 'white',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      border: m.is_urgent ? '2px solid #E74C3C' : 'none',
                    }}>
                      {m.is_urgent && <div style={{ fontSize: '10px', fontWeight: 700, color: m.sender_role === 'client' ? '#E74C3C' : '#FFD5D5', marginBottom: '4px', textTransform: 'uppercase' }}>Urgent</div>}
                      {m.subject && <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '2px' }}>{m.subject}</div>}
                      <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.body}</div>
                      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '6px' }}>{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px 20px', borderTop: '1px solid #eee' }}>
                  <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..." rows={2}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      onClick={() => sendReply({ id: activeThreadClientId, name: activeThreadMeta?.clientName, email: activeThreadMeta?.clientEmail })}
                      disabled={replySending || !replyText.trim()}
                      style={{ padding: '9px 20px', background: replyText.trim() ? BLUE : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: replyText.trim() ? 'pointer' : 'default' }}>
                      {replySending ? 'Sending...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
