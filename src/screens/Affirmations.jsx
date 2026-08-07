import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning } from '../components/VictimInfoWarning';

const AFFIRMATIONS = ["Your work creates stability in someone's life today.", "Every record you keep is a bridge to someone's future.", "You show up so others can show up too.", "The documentation you complete today protects a family tomorrow.", "Your consistency gives clients a chance at consistency.", "You are part of the system that helps people rebuild.", "Every check-in you verify is proof that someone tried.", "You carry difficult work with professionalism and care.", "Behind every case file is a human being you are helping.", "What you do matters — even when it feels routine.", "You are a compliance bridge between courts and communities.", "Your diligence gives clients a fair shot.", "The work is hard. You are harder.", "You hold space for people at their most vulnerable.", "The reports you generate tell stories of progress."];

export default function Affirmations({ role = 'provider' }) {
  const [todayAffirmation, setTodayAffirmation] = useState('');
  const [saved, setSaved] = useState([]);
  const [newAffirmation, setNewAffirmation] = useState('');
  const [reflection, setReflection] = useState('');
  const [tab, setTab] = useState('today');
  const [error, setError] = useState(null);

  useEffect(() => {
    const idx = new Date().getDay() + new Date().getDate();
    setTodayAffirmation(AFFIRMATIONS[idx % AFFIRMATIONS.length]);
    fetchSaved();
  }, []);

  async function fetchSaved() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('affirmations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setSaved(data);
  }

  async function saveNew() {
    if (!newAffirmation.trim()) return;
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('affirmations').insert([{ user_id: user.id, affirmation: newAffirmation, role }]);
    if (error) { setError('Could not save: ' + error.message); return; }
    setNewAffirmation('');
    fetchSaved();
  }

  async function saveReflection() {
    if (!reflection.trim()) return;
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('affirmations').insert([{ user_id: user.id, affirmation: reflection, role, is_reflection: true, reflection_date: new Date().toISOString() }]);
    if (error) { setError('Could not save: ' + error.message); return; }
    setReflection('');
    fetchSaved();
  }

  const inputStyle = { width: '100%', padding: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, fontSize: 14, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 600, fontFamily: NAV_FONT }}>
      <h1 style={{ color: TEXT, marginBottom: 8 }}>Affirmations</h1>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>A moment to remember why this work matters.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {['today', 'saved', 'reflection'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 16px', background: tab === t ? ACCENT : 'rgba(255,255,255,0.04)', color: tab === t ? 'white' : ACCENT, border: `0.5px solid ${ACCENT}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      {tab === 'today' && (
        <div>
          <div style={{ background: ACCENT, borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p style={{ color: 'white', fontSize: 20, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{todayAffirmation}"</p>
          </div>
          <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <h2 style={{ color: TEXT, fontSize: 15, marginBottom: 12 }}>Save Your Own</h2>
            <textarea placeholder="Write an affirmation..." value={newAffirmation} onChange={e => setNewAffirmation(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} />
            {error && <div style={{ color: RED, fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button onClick={saveNew} style={{ marginTop: 10, padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Save</button>
          </div>
        </div>
      )}
      {tab === 'saved' && (
        <div>
          {saved.filter(a => !a.is_reflection).length === 0 ? <p style={{ color: TEXT_MUTED }}>No saved affirmations yet.</p> :
            saved.filter(a => !a.is_reflection).map(a => (
              <div key={a.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 15, color: TEXT, fontStyle: 'italic' }}>"{a.affirmation}"</p>
              </div>
            ))}
        </div>
      )}
      {tab === 'reflection' && (
        <div>
          <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h2 style={{ color: TEXT, fontSize: 15, marginBottom: 12 }}>Today's Reflection</h2>
            <NotesWarning />
            <textarea placeholder="What went well today? What was hard?" value={reflection} onChange={e => setReflection(e.target.value)} style={{ ...inputStyle, minHeight: 120 }} />
            {error && <div style={{ color: RED, fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button onClick={saveReflection} style={{ marginTop: 10, padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Save Reflection</button>
          </div>
          {saved.filter(a => a.is_reflection).map(a => (
            <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 14, marginBottom: 8 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: TEXT_DIM }}>{new Date(a.reflection_date).toLocaleDateString()}</p>
              <p style={{ margin: 0, fontSize: 14, color: TEXT_MUTED }}>{a.affirmation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
