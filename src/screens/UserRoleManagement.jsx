import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const ORG_ROLES = [
  { value: 'admin', label: 'Admin — full org access' },
  { value: 'case_manager', label: 'Case Manager' },
  { value: 'front_desk', label: 'Front Desk / Intake' },
  { value: 'provider', label: 'Provider (default)' },
];

export default function UserRoleManagement({ session }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  async function fetchMembers() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (err) { setError('Could not load staff: ' + err.message); setLoading(false); return; }
    setMembers(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchMembers(); }, []);

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
      <h1 style={{ color: TEXT, margin: '0 0 4px' }}>User &amp; Role Management</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
        Manage who on your team has admin access. There's no self-service "invite staff" flow yet — for now, have a new staff member create a regular account, then promote them here.
      </p>

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
