import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const FORM_TYPES = ['Waiver', 'Release of Information', 'Media Consent', 'Photo/Video Consent', 'Other'];

export default function Forms() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', form_type: 'Waiver', content: '' });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    const { data } = await supabase.from('form_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
  }

  async function addTemplate() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('form_templates').insert({
      provider_id: user.id,
      title: form.title.trim(),
      form_type: form.form_type,
      content: form.content.trim(),
    });
    if (error) {
      setSaveError('Could not save: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ title: '', form_type: 'Waiver', content: '' });
    setShowForm(false);
    setSaving(false);
    fetchTemplates();
  }

  async function toggleActive(t) {
    await supabase.from('form_templates').update({ active: !t.active, updated_at: new Date().toISOString() }).eq('id', t.id);
    fetchTemplates();
  }

  async function viewSignatures(t) {
    setSelected(t);
    setLoadingSignatures(true);
    const { data } = await supabase.from('form_signatures').select('*, clients(name)').eq('form_template_id', t.id).order('signed_at', { ascending: false });
    setSignatures(data || []);
    setLoadingSignatures(false);
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Forms &amp; Signatures</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ New Form</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Build a reusable form library once — clients sign it electronically from their app, and each signature is kept as a permanent, timestamped record.</p>

      {showForm && (
        <div style={{ background: CARD_BG, border: `1px solid ${ACCENT}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <input placeholder="Form title (e.g. Release of Information)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <select value={form.form_type} onChange={e => setForm({ ...form, form_type: e.target.value })} style={inputStyle}>
            {FORM_TYPES.map(t => <option key={t} style={{ background: '#1E2A3A', color: '#fff' }}>{t}</option>)}
          </select>
          <textarea placeholder="Full form text the client will read and sign..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} style={{ ...inputStyle, minHeight: 160 }} />
          <div style={{ background: 'rgba(61,111,168,0.12)', border: `0.5px solid ${WARNING}`, borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: WARNING }}>
            ⚠ Treat any form text you write here as a draft — have it reviewed before relying on it as legally binding.
          </div>
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={addTemplate} disabled={saving || !form.title.trim() || !form.content.trim()}
            style={{ width: '100%', padding: 13, background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15, fontWeight: 'bold' }}>
            {saving ? 'Saving...' : 'Add to Form Library'}
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📝</p>
          <p>No forms in your library yet.</p>
        </div>
      ) : templates.map(t => (
        <div key={t.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{t.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXT_DIM }}>{t.form_type} • Added {new Date(t.created_at).toLocaleDateString()}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => viewSignatures(t)} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', color: ACCENT, border: `0.5px solid ${ACCENT}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>View Signatures</button>
              <button onClick={() => toggleActive(t)} style={{ padding: '8px 14px', background: t.active ? 'rgba(248,113,113,0.15)' : 'rgba(76,175,125,0.15)', color: t.active ? RED : GREEN, border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t.active ? 'Retire' : 'Reactivate'}
              </button>
            </div>
          </div>

          {selected?.id === t.id && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `0.5px solid ${BORDER}` }}>
              {loadingSignatures ? <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading...</p> : signatures.length === 0 ? (
                <p style={{ color: TEXT_MUTED, fontSize: 13, margin: 0 }}>No clients have signed this yet.</p>
              ) : signatures.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ color: TEXT }}>{s.clients?.name || 'Unknown'} — <em>{s.signature_name}</em></span>
                  <span style={{ color: TEXT_DIM }}>{new Date(s.signed_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
