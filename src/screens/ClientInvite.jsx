import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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

  return (
    <div style={{ padding: '30px', maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Client Invites</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Invite Client</button>
      </div>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>Send a branded welcome email with a signup link. The client is automatically connected to your account when they sign up.</p>

      {status && <div style={{ background: status.includes('✅') ? '#d4edda' : '#fdecea', border: `1px solid ${status.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`, borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: status.includes('✅') ? '#155724' : '#721c24' }}>{status}</div>}

      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1B3A6B', marginBottom: '16px', fontSize: '16px' }}>Invite a New Client</h2>
          <input placeholder="Client Full Name *" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} />
          <input placeholder="Client Email Address *" type="email" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} />
          <select value={form.program_type} onChange={e => setForm({...form, program_type: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
            <option value="">Program Type (optional)</option>
            <option>BIP (Batterers Intervention)</option><option>DUI</option><option>Drug Court</option><option>Mental Health Court</option><option>Veterans Court</option><option>Anger Management</option><option>Substance Abuse</option><option>Probation Supervision</option>
          </select>
          <textarea placeholder="Personal message to include in the email (optional)" value={form.message} onChange={e => setForm({...form, message: e.target.value})} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', minHeight: '80px' }} />
          <div style={{ background: '#f0f4fa', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#555' }}>
            📧 The client will receive a branded email from CourtBridge Solutions with a secure signup link. The link expires in 7 days. When they sign up, they are automatically connected to your provider account.
          </div>
          <button onClick={sendInvite} disabled={saving || !form.client_name || !form.client_email} style={{ width: '100%', padding: '13px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
            {saving ? 'Sending...' : '📤 Send Invite'}
          </button>
        </div>
      )}

      {invites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>📨</p>
          <p>No invites sent yet. Invite your first client above.</p>
        </div>
      ) : (
        <div>
          <h2 style={{ color: '#1B3A6B', marginBottom: '16px', fontSize: '16px' }}>Sent Invites</h2>
          {invites.map(i => (
            <div key={i.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{i.client_name}</p>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>{i.client_email}</p>
                {i.program_type && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>{i.program_type}</p>}
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>Sent {new Date(i.created_at).toLocaleDateString()} • Expires {new Date(i.expires_at).toLocaleDateString()}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: i.accepted ? '#d4edda' : '#fff3cd', color: i.accepted ? '#155724' : '#856404' }}>
                  {i.accepted ? '✅ Signed Up' : '⏳ Pending'}
                </span>
                {!i.accepted && (
                  <button onClick={() => resendInvite(i)} disabled={saving} style={{ padding: '5px 12px', background: 'white', color: '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
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
