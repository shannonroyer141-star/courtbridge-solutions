import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AFFIRMATIONS = ["Your work creates stability in someone's life today.", "Every record you keep is a bridge to someone's future.", "You show up so others can show up too.", "The documentation you complete today protects a family tomorrow.", "Your consistency gives clients a chance at consistency.", "You are part of the system that helps people rebuild.", "Every check-in you verify is proof that someone tried.", "You carry difficult work with professionalism and care.", "Behind every case file is a human being you are helping.", "What you do matters — even when it feels routine.", "You are a compliance bridge between courts and communities.", "Your diligence gives clients a fair shot.", "The work is hard. You are harder.", "You hold space for people at their most vulnerable.", "The reports you generate tell stories of progress."];

export default function Affirmations({ role = 'provider' }) {
  const [todayAffirmation, setTodayAffirmation] = useState('');
  const [saved, setSaved] = useState([]);
  const [newAffirmation, setNewAffirmation] = useState('');
  const [reflection, setReflection] = useState('');
  const [tab, setTab] = useState('today');

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
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('affirmations').insert([{ user_id: user.id, affirmation: newAffirmation, role }]);
    setNewAffirmation('');
    fetchSaved();
  }

  async function saveReflection() {
    if (!reflection.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('affirmations').insert([{ user_id: user.id, affirmation: reflection, role, is_reflection: true, reflection_date: new Date().toISOString() }]);
    setReflection('');
    fetchSaved();
  }

  return (
    <div style={{ padding: '30px', maxWidth: '600px' }}>
      <h1 style={{ color: '#1B3A6B', marginBottom: '8px' }}>Affirmations</h1>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>A moment to remember why this work matters.</p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        {['today', 'saved', 'reflection'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '9px 16px', background: tab === t ? '#1B3A6B' : 'white', color: tab === t ? 'white' : '#1B3A6B', border: '1px solid #1B3A6B', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', textTransform: 'capitalize' }}>{t}</button>
        ))}
      </div>
      {tab === 'today' && (
        <div>
          <div style={{ background: '#1B3A6B', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p style={{ color: 'white', fontSize: '20px', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>"{todayAffirmation}"</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ color: '#1B3A6B', fontSize: '15px', marginBottom: '12px' }}>Save Your Own</h2>
            <textarea placeholder="Write an affirmation..." value={newAffirmation} onChange={e => setNewAffirmation(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '80px', boxSizing: 'border-box' }} />
            <button onClick={saveNew} style={{ marginTop: '10px', padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Save</button>
          </div>
        </div>
      )}
      {tab === 'saved' && (
        <div>
          {saved.filter(a => !a.is_reflection).length === 0 ? <p style={{ color: '#666' }}>No saved affirmations yet.</p> :
            saved.filter(a => !a.is_reflection).map(a => (
              <div key={a.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
                <p style={{ margin: 0, fontSize: '15px', color: '#333', fontStyle: 'italic' }}>"{a.affirmation}"</p>
              </div>
            ))}
        </div>
      )}
      {tab === 'reflection' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ color: '#1B3A6B', fontSize: '15px', marginBottom: '12px' }}>Today's Reflection</h2>
            <textarea placeholder="What went well today? What was hard?" value={reflection} onChange={e => setReflection(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minHeight: '120px', boxSizing: 'border-box' }} />
            <button onClick={saveReflection} style={{ marginTop: '10px', padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Save Reflection</button>
          </div>
          {saved.filter(a => a.is_reflection).map(a => (
            <div key={a.id} style={{ background: '#f4f6f9', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#888' }}>{new Date(a.reflection_date).toLocaleDateString()}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#444' }}>{a.affirmation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
