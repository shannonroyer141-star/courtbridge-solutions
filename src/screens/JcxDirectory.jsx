import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const CAPACITY_LABEL = { accepting: 'Accepting Referrals', limited: 'Limited Capacity', full: 'At Capacity' };
const CAPACITY_COLOR = { accepting: GREEN, limited: WARNING, full: RED };

export default function JcxDirectory({ session, isOrgAdmin, isFounder }) {
  const [orgs, setOrgs] = useState([]);
  const [myOrg, setMyOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({ directory_visible: false, specialty_tags: '', capacity_status: 'accepting', directory_description: '', directory_contact_email: '', directory_contact_phone: '' });
  const canEdit = !!(isOrgAdmin || isFounder);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single();
    if (profile?.organization_id) {
      const { data: mine } = await supabase.from('organizations').select('*').eq('id', profile.organization_id).single();
      if (mine) {
        setMyOrg(mine);
        setForm({
          directory_visible: !!mine.directory_visible,
          specialty_tags: mine.specialty_tags || '',
          capacity_status: mine.capacity_status || 'accepting',
          directory_description: mine.directory_description || '',
          directory_contact_email: mine.directory_contact_email || session.user.email || '',
          directory_contact_phone: mine.directory_contact_phone || '',
        });
      }
    }
    const { data: visible } = await supabase.from('organizations').select('*').eq('directory_visible', true).order('organization_name');
    setOrgs((visible || []).filter(o => o.id !== profile?.organization_id));
    setLoading(false);
  }

  async function saveListing() {
    if (!myOrg) return;
    setSaving(true);
    setSaveError(null);
    const { data, error } = await supabase.from('organizations').update(form).eq('id', myOrg.id).select();
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    if (!data || data.length === 0) { setSaveError("That didn't save — you may not have permission to edit your agency's listing. Only an org admin can."); return; }
    setEditing(false);
    load();
  }

  const inputStyle = { width: '100%', padding: 11, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14 };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 };

  if (loading) return <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading directory...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 820, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, margin: '0 0 4px' }}>Agency Directory</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
        Other agencies on CourtBridge who've opted in to be discoverable — for referrals when you don't have the right program or capacity for a client.
      </p>

      <div style={{ background: CARD_BG, border: `0.5px solid ${ACCENT}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing ? 16 : 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Your Listing</div>
          {canEdit ? (
            <button onClick={() => setEditing(!editing)} style={{ padding: '7px 14px', background: 'transparent', border: `0.5px solid ${ACCENT}`, color: ACCENT, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
              {editing ? 'Cancel' : 'Edit Listing'}
            </button>
          ) : (
            <span style={{ fontSize: 12, color: TEXT_DIM }}>Only an org admin can edit this</span>
          )}
        </div>
        {!editing ? (
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 10 }}>
            {myOrg?.directory_visible
              ? <>Visible in the directory. Capacity: <strong style={{ color: CAPACITY_COLOR[myOrg.capacity_status] || TEXT }}>{CAPACITY_LABEL[myOrg.capacity_status] || 'Not set'}</strong></>
              : 'Not currently visible to other agencies. Edit your listing to opt in.'}
          </div>
        ) : (
          <>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT, marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.directory_visible} onChange={e => setForm({ ...form, directory_visible: e.target.checked })} />
              Make my agency visible in the directory
            </label>
            <label style={labelStyle}>Specialties (comma-separated)</label>
            <input style={inputStyle} value={form.specialty_tags} onChange={e => setForm({ ...form, specialty_tags: e.target.value })} placeholder="Drug Court, BIP, Veterans Court" />
            <label style={labelStyle}>Capacity</label>
            <select style={inputStyle} value={form.capacity_status} onChange={e => setForm({ ...form, capacity_status: e.target.value })}>
              <option value="accepting" style={{ background: '#1E2A3A', color: '#fff' }}>Accepting Referrals</option>
              <option value="limited" style={{ background: '#1E2A3A', color: '#fff' }}>Limited Capacity</option>
              <option value="full" style={{ background: '#1E2A3A', color: '#fff' }}>At Capacity</option>
            </select>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 70 }} value={form.directory_description} onChange={e => setForm({ ...form, directory_description: e.target.value })} placeholder="Briefly describe your agency and who you serve" />
            <label style={labelStyle}>Contact Email</label>
            <input style={inputStyle} value={form.directory_contact_email} onChange={e => setForm({ ...form, directory_contact_email: e.target.value })} />
            <label style={labelStyle}>Contact Phone</label>
            <input style={inputStyle} value={form.directory_contact_phone} onChange={e => setForm({ ...form, directory_contact_phone: e.target.value })} />
            {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
            <button onClick={saveListing} disabled={saving} style={{ padding: '10px 20px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving...' : 'Save Listing'}
            </button>
          </>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 }}>{orgs.length} Agenc{orgs.length === 1 ? 'y' : 'ies'} Listed</div>
      {orgs.length === 0 ? (
        <div style={{ color: TEXT_DIM, fontSize: 13 }}>No other agencies have opted into the directory yet.</div>
      ) : orgs.map(o => (
        <div key={o.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 18, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{o.organization_name}</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: CAPACITY_COLOR[o.capacity_status] || TEXT_MUTED }}>
              {CAPACITY_LABEL[o.capacity_status] || 'Capacity not set'}
            </span>
          </div>
          {o.specialty_tags && <div style={{ fontSize: 12, color: ACCENT, marginTop: 4 }}>{o.specialty_tags}</div>}
          {o.directory_description && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 8, lineHeight: 1.5 }}>{o.directory_description}</div>}
          <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 10 }}>
            {o.directory_contact_email} {o.directory_contact_phone ? `· ${o.directory_contact_phone}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
