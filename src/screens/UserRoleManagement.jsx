import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { createStaffInvite, validateStaffInvite, ORG_ROLES } from '../staffInvite';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const emptyInviteForm = () => ({ full_name: '', email: '', org_role: 'provider', is_org_admin: false });

export default function UserRoleManagement({ session }) {
  const [members, setMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [myOrg, setMyOrg] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState(emptyInviteForm());
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteLink, setInviteLink] = useState(null);

  async function fetchMembers() {
    setLoading(true);
    setError(null);
    const { data: myProfile } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single();
    setMyOrg(myProfile?.organization_id || null);

    const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (err) { setError('Could not load staff: ' + err.message); setLoading(false); return; }
    setMembers(data || []);

    if (myProfile?.organization_id) {
      const { data: invites } = await supabase.from('staff_invites').select('*')
        .eq('organization_id', myProfile.organization_id).eq('accepted', false)
        .order('created_at', { ascending: false });
      setPendingInvites(invites || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchMembers(); }, []);

  function updateInviteForm(field, value) { setInviteForm(prev => ({ ...prev, [field]: value })); setInviteError(null); }

  async function sendStaffInvite() {
    const validationError = validateStaffInvite(inviteForm);
    if (validationError) { setInviteError(validationError); return; }
    setSendingInvite(true);
    setInviteError(null);
    setInviteLink(null);

    const { link, invite, error: createError } = await createStaffInvite(myOrg, session.user.id, inviteForm);
    if (createError || !invite) { setInviteError('Could not create invite: ' + (createError?.message || 'unknown error')); setSendingInvite(false); return; }

    const { data: myProfile } = await supabase.from('profiles').select('full_name, email, organization_name').eq('id', session.user.id).single();
    const { data: org } = await supabase.from('organizations').select('organization_name').eq('id', myOrg).single();

    const { error: fnError } = await supabase.functions.invoke('send-staff-invite', {
      body: {
        staff_email: invite.email,
        staff_name: invite.full_name,
        invited_by_name: myProfile?.full_name || myProfile?.email,
        organization_name: org?.organization_name || myProfile?.organization_name,
        invite_token: invite.token,
        org_role_label: ORG_ROLES.find(r => r.value === invite.org_role)?.label.split(' — ')[0],
      },
    });
    if (fnError) { setInviteError('Invite created, but the email failed to send. Share this link directly instead: ' + link); }

    setInviteLink(link);
    setInviteForm(emptyInviteForm());
    setSendingInvite(false);
    fetchMembers();
  }

  async function revokeInvite(id) {
    setSavingId(id);
    await supabase.from('staff_invites').delete().eq('id', id);
    setPendingInvites(prev => prev.filter(i => i.id !== id));
    setSavingId(null);
  }

  async function updateMember(id, changes) {
    setSavingId(id);
    setError(null);
    const { error: err } = await supabase.from('profiles').update(changes).eq('id', id);
    if (err) { setError('Could not save: ' + err.message); setSavingId(null); return; }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
    setSavingId(null);
  }

  const isSelf = (m) => m.id === session.user.id;

  const badge = (bg, fg, text) => (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: bg, color: fg, whiteSpace: 'nowrap' }}>{text}</span>
  );

  if (loading) return <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading staff...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 820, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 4, flexWrap: 'wrap' }}>
        <h1 style={{ color: TEXT, margin: 0 }}>User &amp; Role Management</h1>
        <button
          onClick={() => { setShowInviteForm(v => !v); setInviteLink(null); setInviteError(null); }}
          style={{ padding: '9px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: NAV_FONT }}
        >
          {showInviteForm ? 'Cancel' : '+ Invite Staff Member'}
        </button>
      </div>
      <p style={{ color: TEXT_MUTED, marginTop: 4, marginBottom: 24, fontSize: 14 }}>
        Manage who on your team has admin access, and invite new team members directly.
      </p>

      {showInviteForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          {inviteError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{inviteError}</div>}
          {inviteLink && (
            <div style={{ background: 'rgba(76,175,125,0.1)', border: `0.5px solid ${GREEN}`, borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13, color: GREEN }}>
              Invite sent. If you ever need to share it directly instead: <span style={{ wordBreak: 'break-all', color: TEXT }}>{inviteLink}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, marginBottom: 6 }}>Full Name</label>
              <input
                value={inviteForm.full_name}
                onChange={e => updateInviteForm('full_name', e.target.value)}
                placeholder="Jane Smith"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: `0.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXT, fontSize: 13, fontFamily: NAV_FONT, boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, marginBottom: 6 }}>Email</label>
              <input
                value={inviteForm.email}
                onChange={e => updateInviteForm('email', e.target.value)}
                placeholder="jane@yourorg.org"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: `0.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.04)', color: TEXT, fontSize: 13, fontFamily: NAV_FONT, boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <select
              value={inviteForm.org_role}
              onChange={e => updateInviteForm('org_role', e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 6, border: `0.5px solid ${BORDER}`, background: CARD_BG, color: TEXT, fontSize: 13, fontFamily: NAV_FONT }}
            >
              {ORG_ROLES.map(r => <option key={r.value} value={r.value} style={{ background: '#1E2A3A', color: '#fff' }}>{r.label}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_MUTED, cursor: 'pointer' }}>
              <input type="checkbox" checked={inviteForm.is_org_admin} onChange={e => updateInviteForm('is_org_admin', e.target.checked)} />
              Org Admin
            </label>
          </div>
          <button
            onClick={sendStaffInvite}
            disabled={sendingInvite}
            style={{ padding: '10px 18px', background: sendingInvite ? 'rgba(255,255,255,0.08)' : GREEN, color: sendingInvite ? TEXT_DIM : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: sendingInvite ? 'default' : 'pointer', fontFamily: NAV_FONT }}
          >
            {sendingInvite ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Pending Invites</div>
          <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
            {pendingInvites.map((inv, i) => (
              <div key={inv.id} style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: i === pendingInvites.length - 1 ? 'none' : `0.5px solid ${BORDER}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{inv.full_name || inv.email}</div>
                  <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{inv.email} · {ORG_ROLES.find(r => r.value === inv.org_role)?.label.split(' — ')[0] || inv.org_role}</div>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  disabled={savingId === inv.id}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: 'rgba(248,113,113,0.12)', color: RED }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div style={{ color: RED, fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
        {members.length === 0 ? (
          <div style={{ padding: 24, color: TEXT_DIM, fontSize: 14 }}>No staff found.</div>
        ) : members.map((m, i) => (
          <div key={m.id} style={{ padding: '16px 20px', borderBottom: i === members.length - 1 ? 'none' : `0.5px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {m.contact_name || m.full_name || m.email}
                  {isSelf(m) && badge('rgba(91,155,240,0.15)', ACCENT, 'YOU')}
                  {m.is_founder && badge('rgba(76,175,125,0.15)', GREEN, 'FOUNDER')}
                  {m.account_status === 'inactive' && badge('rgba(248,113,113,0.15)', RED, 'DEACTIVATED')}
                </div>
                <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>{m.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={m.org_role || 'provider'}
                disabled={m.is_founder || savingId === m.id}
                onChange={e => updateMember(m.id, { org_role: e.target.value })}
                style={{ padding: '8px 10px', borderRadius: 6, border: `0.5px solid ${BORDER}`, background: CARD_BG, color: TEXT, fontSize: 13, fontFamily: NAV_FONT }}
              >
                {ORG_ROLES.map(r => <option key={r.value} value={r.value} style={{ background: '#1E2A3A', color: '#fff' }}>{r.label}</option>)}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: TEXT_MUTED, cursor: m.is_founder ? 'default' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!m.is_org_admin}
                  disabled={m.is_founder || savingId === m.id}
                  onChange={e => updateMember(m.id, { is_org_admin: e.target.checked })}
                />
                Org Admin
              </label>

              {!m.is_founder && !isSelf(m) && (
                <button
                  onClick={() => updateMember(m.id, { account_status: m.account_status === 'inactive' ? 'active' : 'inactive' })}
                  disabled={savingId === m.id}
                  style={{
                    padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: m.account_status === 'inactive' ? 'rgba(76,175,125,0.15)' : 'rgba(248,113,113,0.12)',
                    color: m.account_status === 'inactive' ? GREEN : RED,
                  }}
                >
                  {m.account_status === 'inactive' ? 'Reactivate' : 'Deactivate'}
                </button>
              )}
              {savingId === m.id && <span style={{ fontSize: 12, color: TEXT_DIM }}>Saving...</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: TEXT_DIM, lineHeight: 1.6 }}>
        Deactivating someone blocks their access without deleting anything — their history stays intact and they can be reactivated anytime.<br />
        The role dropdown (Case Manager, Front Desk, etc.) is a label for your own reference only — it doesn't change what someone can access. "Org Admin" and "Deactivate" are the two controls that actually restrict access today.
      </div>
    </div>
  );
}
