import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const BLUE = '#1B3A6B';
const FORM_TYPES = ['Waiver', 'Release of Information', 'Media Consent', 'Photo/Video Consent', 'Other'];

export default function Forms() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', form_type: 'Waiver', content: '' });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [loadingSignatures, setLoadingSignatures] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  async function fetchTemplates() {
    const { data } = await supabase.from('form_templates').select('*').order('created_at', { ascending: false });
    if (data) setTemplates(data);
  }

  async function addTemplate() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('form_templates').insert({
      provider_id: user.id,
      title: form.title.trim(),
      form_type: form.form_type,
      content: form.content.trim(),
    });
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

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: BLUE, margin: 0 }}>Forms &amp; Signatures</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: BLUE, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ New Form</button>
      </div>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>Build a reusable form library once — clients sign it electronically from their app, and each signature is kept as a permanent, timestamped record.</p>

      {showForm && (
        <div style={{ background: 'white', border: `1px solid ${BLUE}`, borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <input placeholder="Form title (e.g. Release of Information)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px' }} />
          <select value={form.form_type} onChange={e => setForm({ ...form, form_type: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
            {FORM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <textarea placeholder="Full form text the client will read and sign..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
            style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', minHeight: '160px' }} />
          <div style={{ background: '#FEF3C7', border: '1px solid #F0C040', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#7A5C00' }}>
            ⚠ Treat any form text you write here as a draft — have it reviewed before relying on it as legally binding.
          </div>
          <button onClick={addTemplate} disabled={saving || !form.title.trim() || !form.content.trim()}
            style={{ width: '100%', padding: '13px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
            {saving ? 'Saving...' : 'Add to Form Library'}
          </button>
        </div>
      )}

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>📝</p>
          <p>No forms in your library yet.</p>
        </div>
      ) : templates.map(t => (
        <div key={t.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: BLUE }}>{t.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>{t.form_type} • Added {new Date(t.created_at).toLocaleDateString()}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => viewSignatures(t)} style={{ padding: '8px 14px', background: 'white', color: BLUE, border: `1px solid ${BLUE}`, borderRadius: '8px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>View Signatures</button>
              <button onClick={() => toggleActive(t)} style={{ padding: '8px 14px', background: t.active ? '#FDEDEC' : '#E1F5EE', color: t.active ? '#C0392B' : '#085041', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t.active ? 'Retire' : 'Reactivate'}
              </button>
            </div>
          </div>

          {selected?.id === t.id && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
              {loadingSignatures ? <p style={{ color: '#888', fontSize: 13 }}>Loading...</p> : signatures.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>No clients have signed this yet.</p>
              ) : signatures.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                  <span style={{ color: '#374151' }}>{s.clients?.name || 'Unknown'} — <em>{s.signature_name}</em></span>
                  <span style={{ color: '#888' }}>{new Date(s.signed_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
