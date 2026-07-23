import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

export default function FounderDocs() {
  const [docs, setDocs] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => { fetchDocs(); }, []);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = width < 640;

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

  if (loading) return <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading founder docs...</div>;

  return (
    <div style={{ padding: isPhone ? 16 : 30, display: 'flex', gap: 20, maxWidth: 1100, flexDirection: isPhone ? 'column' : 'row', fontFamily: NAV_FONT }}>
      <div style={{ width: isPhone ? '100%' : 220, flexShrink: 0 }}>
        <h1 style={{ color: TEXT, fontSize: 20, margin: '0 0 4px' }}>Founder</h1>
        <p style={{ color: TEXT_DIM, fontSize: 12, margin: '0 0 20px' }}>Only visible to founder accounts</p>
        {docs.map(d => (
          <div key={d.slug} onClick={() => { setActiveSlug(d.slug); setEditing(false); }}
            style={{
              padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, marginBottom: 4,
              background: activeSlug === d.slug ? ACCENT : 'transparent',
              color: activeSlug === d.slug ? '#fff' : TEXT_MUTED,
              fontWeight: activeSlug === d.slug ? 600 : 400,
            }}>
            {d.title}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 28, minHeight: 500 }}>
        {!active ? (
          <div style={{ color: TEXT_MUTED }}>Select a document</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ color: TEXT, margin: 0, fontSize: 18 }}>{active.title}</h2>
              {!editing ? (
                <button onClick={startEditing} style={{ padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveDoc} disabled={saving} style={{ padding: '8px 16px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
              )}
            </div>

            {!editing ? (
              <div style={{ fontSize: 14, color: TEXT, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{active.content}</div>
            ) : (
              <textarea value={draft} onChange={e => setDraft(e.target.value)}
                style={{ width: '100%', minHeight: 440, padding: 14, borderRadius: 8, border: `0.5px solid ${BORDER}`, fontSize: 13, fontFamily: 'ui-monospace, monospace', lineHeight: 1.6, boxSizing: 'border-box', resize: 'vertical', background: 'rgba(255,255,255,0.04)', color: TEXT }} />
            )}

            <p style={{ marginTop: 18, fontSize: 11, color: TEXT_DIM }}>Last updated {new Date(active.updated_at).toLocaleString()}</p>
          </>
        )}
      </div>
    </div>
  );
}
