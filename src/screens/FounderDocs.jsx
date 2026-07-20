import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const BLUE = '#1B3A6B';

export default function FounderDocs() {
  const [docs, setDocs] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    setLoading(true);
    const { data } = await supabase.from('founder_docs').select('*').order('title');
    if (data) {
      setDocs(data);
      if (!activeSlug && data.length > 0) setActiveSlug(data[0].slug);
    }
    setLoading(false);
  }

  const active = docs.find(d => d.slug === activeSlug);

  function startEditing() {
    setDraft(active?.content || '');
    setEditing(true);
  }

  async function saveDoc() {
    setSaving(true);
    await supabase.from('founder_docs').update({ content: draft, updated_at: new Date().toISOString() }).eq('slug', activeSlug);
    setEditing(false);
    setSaving(false);
    fetchDocs();
  }

  if (loading) return <div style={{ padding: 30, color: '#666' }}>Loading founder docs...</div>;

  return (
    <div style={{ padding: '30px', display: 'flex', gap: '20px', maxWidth: '1100px' }}>
      <div style={{ width: '220px', flexShrink: 0 }}>
        <h1 style={{ color: BLUE, fontSize: '20px', margin: '0 0 4px' }}>Founder</h1>
        <p style={{ color: '#888', fontSize: '12px', margin: '0 0 20px' }}>Only visible to founder accounts</p>
        {docs.map(d => (
          <div key={d.slug} onClick={() => { setActiveSlug(d.slug); setEditing(false); }}
            style={{
              padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', marginBottom: '4px',
              background: activeSlug === d.slug ? BLUE : 'transparent',
              color: activeSlug === d.slug ? '#fff' : '#333',
              fontWeight: activeSlug === d.slug ? 600 : 400,
            }}>
            {d.title}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '28px', minHeight: '500px' }}>
        {!active ? (
          <div style={{ color: '#888' }}>Select a document</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ color: BLUE, margin: 0, fontSize: '18px' }}>{active.title}</h2>
              {!editing ? (
                <button onClick={startEditing} style={{ padding: '8px 16px', background: BLUE, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', background: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveDoc} disabled={saving} style={{ padding: '8px 16px', background: '#27AE60', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>

            {!editing ? (
              <div style={{ fontSize: '14px', color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{active.content}</div>
            ) : (
              <textarea value={draft} onChange={e => setDraft(e.target.value)}
                style={{ width: '100%', minHeight: '440px', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, boxSizing: 'border-box', resize: 'vertical' }} />
            )}

            <p style={{ marginTop: '18px', fontSize: '11px', color: '#aaa' }}>Last updated {new Date(active.updated_at).toLocaleString()}</p>
          </>
        )}
      </div>
    </div>
  );
}
