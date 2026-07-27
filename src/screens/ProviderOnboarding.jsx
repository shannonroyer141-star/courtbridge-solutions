import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

export default function ProviderOnboarding({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    organization_name: '', contact_name: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '',
    program_types: '', license_number: '', website: '',
  });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (data) {
      setForm({
        organization_name: data.organization_name || '',
        contact_name: data.contact_name || '',
        email: data.email || session.user.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        program_types: data.program_types || '',
        license_number: data.license_number || '',
        website: data.website || '',
      });
      setIsNew(!data.organization_name);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const { error } = await supabase.from('profiles').update(form).eq('id', session.user.id);
    if (error) {
      setSaveError('Could not save: ' + error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    setIsNew(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 14, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 15 };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };

  const field = (key, label, placeholder = '', half = false) => (
    <div style={{ flex: half ? 1 : undefined, minWidth: half ? 180 : undefined, width: half ? undefined : '100%' }}>
      <label style={labelStyle}>{label}</label>
      <input value={form[key]} placeholder={placeholder} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
    </div>
  );

  if (loading) return <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 700, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, margin: '0 0 4px' }}>Provider Onboarding</h1>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 24 }}>
        {isNew
          ? 'Set up your organization profile — this is what shows on court reports, certificates, and your Org Settings page.'
          : 'Update your organization profile.'}
      </p>

      {isNew && (
        <div style={{ background: 'rgba(91,155,240,0.1)', border: `0.5px solid ${ACCENT}`, borderRadius: 10, padding: '14px 18px', marginBottom: 24, fontSize: 13.5, color: TEXT }}>
          Welcome to CourtBridge. Fill this out once to finish setting up your organization — you can come back and edit it anytime.
        </div>
      )}

      <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25 }}>
        <h2 style={{ color: TEXT, fontSize: 15, marginTop: 0, marginBottom: 16 }}>Organization</h2>
        {field('organization_name', 'Organization Name *', 'e.g. Riverside Recovery Services')}
        {field('program_types', 'Program Type(s)', 'e.g. Drug Court, BIP, Probation Monitoring')}
        {field('license_number', 'License Number', '')}
        {field('website', 'Website', 'https://')}

        <h2 style={{ color: TEXT, fontSize: 15, marginTop: 20, marginBottom: 16 }}>Primary Contact</h2>
        {field('contact_name', 'Contact Name *', '')}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 0 }}>
          {field('email', 'Email', '', true)}
          {field('phone', 'Phone', '+15550001234', true)}
        </div>

        <h2 style={{ color: TEXT, fontSize: 15, marginTop: 6, marginBottom: 16 }}>Address</h2>
        {field('address', 'Street Address', '')}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {field('city', 'City', '', true)}
          {field('state', 'State', '', true)}
          {field('zip', 'Zip', '', true)}
        </div>

        {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 14 }}>{saveError}</div>}
        <button
          onClick={handleSave}
          disabled={saving || !form.organization_name || !form.contact_name}
          style={{ width: '100%', padding: 14, background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', opacity: (!form.organization_name || !form.contact_name) ? 0.6 : 1 }}
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Organization Profile'}
        </button>
      </div>
    </div>
  );
}
