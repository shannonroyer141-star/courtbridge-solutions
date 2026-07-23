import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, ORANGE, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

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
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    fetchClients();
    fetchMessages();
  }, []);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = width < 640;

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
  const showListOnPhone = isPhone && !activeThreadClientId;
  const showConvoOnPhone = isPhone && !!activeThreadClientId;

  return (
    <div style={{ padding: isPhone ? 14 : 30, maxWidth: 1100, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0, fontSize: isPhone ? 20 : 26 }}>Messages</h1>
        <button onClick={() => setShowCompose(!showCompose)}
          style={{ padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
          ✉️ Compose
        </button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>
        Two-way messages with your clients — replies send by email and are logged automatically.
      </p>

      {showCompose && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: isPhone ? 16 : 25, marginBottom: 24 }}>
          <h2 style={{ color: TEXT, marginBottom: 16, fontSize: 16 }}>New Message</h2>

          <label style={{ fontWeight: 'bold', color: TEXT_MUTED, fontSize: 13, display: 'block', marginBottom: 6 }}>Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
            style={{ width: '100%', padding: 12, marginBottom: 14, borderRadius: 8, border: `0.5px solid ${BORDER}`, fontSize: 14, background: CARD_BG, color: TEXT, fontFamily: NAV_FONT }}>
            <option value="">Select Client *</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.email ? `— ${c.email}` : '(no email)'}</option>
            ))}
          </select>

          {selectedClient && !client?.email && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: `0.5px solid ${RED}`, borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: RED }}>
              ⚠️ This client does not have an email address on file. Add their email in the Clients screen first.
            </div>
          )}

          <label style={{ fontWeight: 'bold', color: TEXT_MUTED, fontSize: 13, display: 'block', marginBottom: 6 }}>Template (optional)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <button key={key} onClick={() => setTemplate(key)}
                style={{ padding: '7px 14px', background: template === key ? ACCENT : 'rgba(255,255,255,0.04)', color: template === key ? 'white' : ACCENT, border: `0.5px solid ${ACCENT}`, borderRadius: 20, cursor: 'pointer', fontSize: 12 }}>
                {t.label}
              </button>
            ))}
          </div>

          <label style={{ fontWeight: 'bold', color: TEXT_MUTED, fontSize: 13, display: 'block', marginBottom: 6 }}>Subject</label>
          <input placeholder="Subject *" value={subject} onChange={e => setSubject(e.target.value)}
            style={{ width: '100%', padding: 12, marginBottom: 14, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }} />

          <label style={{ fontWeight: 'bold', color: TEXT_MUTED, fontSize: 13, display: 'block', marginBottom: 6 }}>Message</label>
          <textarea placeholder="Write your message... Replace [BRACKETS] with actual details." value={body} onChange={e => setBody(e.target.value)}
            style={{ width: '100%', padding: 12, marginBottom: 14, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, minHeight: 200, lineHeight: 1.6, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }} />

          {status && (
            <div style={{ background: status.includes('✅') ? 'rgba(76,175,125,0.12)' : 'rgba(248,113,113,0.1)', border: `0.5px solid ${status.includes('✅') ? GREEN : RED}`, borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: status.includes('✅') ? GREEN : RED }}>
              {status}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={sendMessage} disabled={sending || !selectedClient || !subject || !body}
              style={{ flex: 2, minWidth: 160, padding: 13, background: selectedClient && subject && body ? ACCENT : 'rgba(255,255,255,0.08)', color: selectedClient && subject && body ? 'white' : TEXT_DIM, border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' }}>
              {sending ? 'Sending...' : '📤 Send Message'}
            </button>
            <button onClick={() => { setShowCompose(false); setStatus(''); }}
              style={{ flex: 1, minWidth: 100, padding: 13, background: 'rgba(255,255,255,0.04)', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 15, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {threadList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED, background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>✉️</p>
          <p>No messages yet. Compose your first message above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isPhone ? 'column' : 'row' }}>
          {(!isPhone || showListOnPhone) && (
            <div style={{ width: isPhone ? '100%' : 280, flexShrink: 0, background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
              {threadList.map(t => (
                <div key={t.clientId} onClick={() => setActiveThreadClientId(t.clientId)}
                  style={{
                    padding: '14px 16px', borderBottom: `0.5px solid ${BORDER}`, cursor: 'pointer',
                    background: activeThreadClientId === t.clientId ? 'rgba(91,155,240,0.12)' : 'transparent',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 14, color: TEXT }}>{t.clientName}</span>
                    {t.hasUrgent && (
                      <span style={{ background: 'rgba(248,113,113,0.15)', color: RED, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>URGENT</span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.last.sender_role === 'client' ? 'Them: ' : 'You: '}{t.last.body}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_DIM }}>{new Date(t.last.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          {(!isPhone || showConvoOnPhone) && (
            <div style={{ flex: 1, width: isPhone ? '100%' : 'auto', background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
              {!activeThreadClientId ? (
                <div style={{ margin: 'auto', color: TEXT_MUTED, fontSize: 14, padding: 40 }}>Select a conversation to view it</div>
              ) : (
                <>
                  <div style={{ padding: '16px 20px', borderBottom: `0.5px solid ${BORDER}`, fontWeight: 'bold', color: TEXT, display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isPhone && (
                      <button onClick={() => setActiveThreadClientId(null)} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 14, cursor: 'pointer', padding: 0 }}>← Back</button>
                    )}
                    {activeThreadMeta?.clientName}
                  </div>
                  <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                    {activeThread.map(m => (
                      <div key={m.id} style={{
                        alignSelf: m.sender_role === 'client' ? 'flex-start' : 'flex-end',
                        maxWidth: '75%',
                        background: m.sender_role === 'client' ? 'rgba(255,255,255,0.06)' : ACCENT,
                        color: m.sender_role === 'client' ? TEXT : 'white',
                        borderRadius: 10,
                        padding: '10px 14px',
                        border: m.is_urgent ? `2px solid ${RED}` : 'none',
                      }}>
                        {m.is_urgent && <div style={{ fontSize: 10, fontWeight: 700, color: m.sender_role === 'client' ? RED : '#FFD5D5', marginBottom: 4, textTransform: 'uppercase' }}>Urgent</div>}
                        {m.subject && <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>{m.subject}</div>}
                        <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{m.body}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 6 }}>{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '16px 20px', borderTop: `0.5px solid ${BORDER}` }}>
                    <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..." rows={2}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, resize: 'vertical', fontFamily: NAV_FONT, background: 'rgba(255,255,255,0.04)', color: TEXT }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button
                        onClick={() => sendReply({ id: activeThreadClientId, name: activeThreadMeta?.clientName, email: activeThreadMeta?.clientEmail })}
                        disabled={replySending || !replyText.trim()}
                        style={{ padding: '9px 20px', background: replyText.trim() ? ACCENT : 'rgba(255,255,255,0.08)', color: replyText.trim() ? 'white' : TEXT_DIM, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 'bold', cursor: replyText.trim() ? 'pointer' : 'default' }}>
                        {replySending ? 'Sending...' : 'Reply'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
