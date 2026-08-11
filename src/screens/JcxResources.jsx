import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT, RED } from '../theme';

const CATEGORIES = [
  { value: 'housing', label: 'Housing', icon: '🏠' },
  { value: 'employment', label: 'Employment', icon: '💼' },
  { value: 'treatment', label: 'Treatment', icon: '🩺' },
  { value: 'legal_aid', label: 'Legal Aid', icon: '⚖️' },
  { value: 'food', label: 'Food Assistance', icon: '🍽️' },
  { value: 'transportation', label: 'Transportation', icon: '🚌' },
  { value: 'other', label: 'Other', icon: '📌' },
];

export default function JcxResources({ session }) {
  const [resources, setResources] = useState([]);
  const [myOrgId, setMyOrgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'housing', description: '', phone: '', website: '', address: '', city: '', state: '', zip: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single();
    setMyOrgId(profile?.organization_id || null);
    const { data } = await supabase.from('resources').select('*').eq('active', true).order('title');
    setResources(data || []);
    setLoading(false);
  }

  async function saveResource() {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!myOrgId) { setError('Your account is not linked to an organization yet.'); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from('resources').insert([{ ...form, added_by_org_id: myOrgId }]);
    if (err) { setError('Could not save: ' + err.message); setSaving(false); return; }
    setForm({ title: '', category: 'housing', description: '', phone: '', website: '', address: '', city: '', state: '', zip: '' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  const inputStyle = { width: '100%', padding: 11, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, fontSize: 14 };
  const filtered = filter === 'all' ? resources : resources.filter(r => r.category === filter);

  if (loading) return <div style={{ padding: 30, color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading resources...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 820, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Resource Marketplace</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Add Resource'}
        </button>
      </div>
      <p style={{ color: TEXT_MUTED, marginTop: 0, marginBottom: 20, fontSize: 14 }}>Outside resources — housing, jobs, treatment, legal aid — shared across agencies for clients who need them.</p>

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${GREEN}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <input style={inputStyle} placeholder="Resource Name *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: '#1E2A3A', color: '#fff' }}>{c.icon} {c.label}</option>)}
          </select>
          <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={inputStyle} placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input style={inputStyle} placeholder="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
          </div>
          <input style={inputStyle} placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={inputStyle} placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <input style={{ ...inputStyle, maxWidth: 80 }} placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
            <input style={{ ...inputStyle, maxWidth: 100 }} placeholder="ZIP" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} />
          </div>
          {error && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button onClick={saveResource} disabled={saving} style={{ padding: '10px 20px', background: GREEN, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Add Resource'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', borderRadius: 20, border: `0.5px solid ${filter === 'all' ? ACCENT : BORDER}`, background: filter === 'all' ? 'rgba(91,155,240,0.15)' : 'transparent', color: filter === 'all' ? ACCENT : TEXT_MUTED, fontSize: 12, cursor: 'pointer' }}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setFilter(c.value)} style={{ padding: '6px 12px', borderRadius: 20, border: `0.5px solid ${filter === c.value ? ACCENT : BORDER}`, background: filter === c.value ? 'rgba(91,155,240,0.15)' : 'transparent', color: filter === c.value ? ACCENT : TEXT_MUTED, fontSize: 12, cursor: 'pointer' }}>{c.icon} {c.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ color: TEXT_DIM, fontSize: 13 }}>No resources in this category yet.</div>
      ) : filtered.map(r => (
        <div key={r.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{CATEGORIES.find(c => c.value === r.category)?.icon} {r.title}</div>
          {r.description && <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.5 }}>{r.description}</div>}
          <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 8 }}>
            {[r.address, r.city, r.state, r.zip].filter(Boolean).join(', ')}
            {r.phone && <> · {r.phone}</>}
            {r.website && <> · <span style={{ color: ACCENT }}>{r.website}</span></>}
          </div>
        </div>
      ))}
    </div>
  );
}
