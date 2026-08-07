import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';

export default function ClientInvite() {
  const [invites, setInvites] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ client_name: '', client_email: '', program_type: '', message: '' });

  useEffect(() => { fetchInvites(); fetchProfile(); }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  }

  async function fetchInvites() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('invites').select('*').eq('provider_id', user.id).order('created_at', { ascending: false });
    if (data) setInvites(data);
  }

  async function sendInvite() {
    if (!form.client_name || !form.client_email) { setStatus('Please enter client name and email.'); return; }
    setSaving(true);
    setStatus('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('invites').insert([{
        provider_id: user.id, client_name: form.client_name, client_email: form.client_email,
        program_type: form.program_type, token, accepted: false,
        expires_at: expiresAt, message: form.message
      }]);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('https://howvgvrrxcpdiqjbnhzn.supabase.co/functions/v1/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          client_name: form.client_name, client_email: form.client_email,
          program_type: form.program_type, message: form.message,
          provider_name: profile?.contact_name, organization_name: profile?.organization_name,
          invite_token: token
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus('✅ Invite sent! The client will receive an email with a signup link.');
        setForm({ client_name: '', client_email: '', program_type: '', message: '' });
        setShowForm(false);
        fetchInvites();
      } else {
        setStatus('Invite saved but email failed: ' + result.error + '. Check your Resend API key in Supabase secrets.');
        fetchInvites();
      }
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setSaving(false);
  }

  async function resendInvite(invite) {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('https://howvgvrrxcpdiqjbnhzn.supabase.co/functions/v1/send-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ client_name: invite.client_name, client_email: invite.client_email, program_type: invite.program_type, provider_name: profile?.contact_name, organization_name: profile?.organization_name, invite_token: invite.token }),
    });
    setSaving(false);
    setStatus('✅ Invite resent to ' + invite.client_email);
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 700, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Client Invites</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Invite Client</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Send a branded welcome email with a signup link. The client is automatically connected to your account when they sign up.</p>

      {status && <div style={{ background: status.includes('✅') ? 'rgba(76,175,125,0.12)' : 'rgba(61,111,168,0.12)', border: `0.5px solid ${status.includes('✅') ? GREEN : WARNING}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: status.includes('✅') ? GREEN : WARNING }}>{status}</div>}

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: TEXT, marginBottom: 16, fontSize: 16 }}>Invite a New Client</h2>
          <input placeholder="Client Full Name *" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} style={inputStyle} />
          <input placeholder="Client Email Address *" type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} style={inputStyle} />
          <select value={form.program_type} onChange={e => setForm({...form, program_type: e.target.value})} style={inputStyle}>
            <option value="">Program Type (optional)</option>
            <option>BIP (Batterers Intervention)</option><option>DUI</option><option>Drug Court</option><option>Mental Health Court</option><option>Veterans Court</option><option>Anger Management</option><option>Substance Abuse</option><option>Probation Supervision</option>
          </select>
          <NotesWarning />
          <textarea placeholder="Personal message to include in the email (optional)" value={form.message} onChange={e => setForm({...form, message: e.target.value})} style={{ ...inputStyle, minHeight: 80, marginBottom: 16 }} />
          <div style={{ background: 'rgba(91,155,240,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: TEXT_MUTED }}>
            📧 The client will receive a branded email from CourtBridge Solutions with a secure signup link. The link expires in 7 days. When they sign up, they are automatically connected to your provider account.
          </div>
          <button onClick={sendInvite} disabled={saving || !form.client_name || !form.client_email} style={{ width: '100%', padding: 13, background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' }}>
            {saving ? 'Sending...' : '📤 Send Invite'}
          </button>
        </div>
      )}

      {invites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📨</p>
          <p>No invites sent yet. Invite your first client above.</p>
        </div>
      ) : (
        <div>
          <h2 style={{ color: TEXT, marginBottom: 16, fontSize: 16 }}>Sent Invites</h2>
          {invites.map(i => (
            <div key={i.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{i.client_name}</p>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{i.client_email}</p>
                {i.program_type && <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXT_DIM }}>{i.program_type}</p>}
                <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXT_DIM }}>Sent {new Date(i.created_at).toLocaleDateString()} • Expires {new Date(i.expires_at).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: i.accepted ? 'rgba(76,175,125,0.15)' : '#fff', color: i.accepted ? GREEN : '#000' }}>
                  {i.accepted ? '✅ Signed Up' : '⏳ Pending'}
                </span>
                {!i.accepted && (
                  <button onClick={() => resendInvite(i)} disabled={saving} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.04)', color: ACCENT, border: `0.5px solid ${ACCENT}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                    Resend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
