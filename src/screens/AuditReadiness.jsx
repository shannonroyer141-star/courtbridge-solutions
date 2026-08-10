import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const EMPTY_FORM = {
  check_date: new Date().toISOString().split('T')[0],
  documentation_score: 80, compliance_score: 80, reporting_score: 80, notes: '',
};

export default function AuditReadiness() {
  const [checks, setChecks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => { fetchChecks(); }, []);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = width < 640;

  async function fetchChecks() {
    const { data } = await supabase.from('audit_readiness').select('*').order('check_date', { ascending: false });
    if (data) setChecks(data);
  }

  function scoreColor(score) {
    if (score >= 80) return GREEN;
    if (score >= 60) return WARNING;
    return RED;
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const documentation = parseInt(form.documentation_score, 10);
    const compliance = parseInt(form.compliance_score, 10);
    const reporting = parseInt(form.reporting_score, 10);
    const overall = Math.round((documentation + compliance + reporting) / 3);
    const payload = {
      check_date: form.check_date,
      documentation_score: documentation,
      compliance_score: compliance,
      reporting_score: reporting,
      overall_score: overall,
      notes: form.notes,
      provider_id: user.id,
    };
    const { error } = await supabase.from('audit_readiness').insert([payload]);
    if (error) {
      setSaveError('Could not save: ' + error.message);
      setSaving(false);
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
    fetchChecks();
  }

  const inputStyle = { padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT, width: '100%' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'block' };

  const scoreSlider = (key, label) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={labelStyle}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(form[key]) }}>{form[key]}</span>
      </div>
      <input type="range" min="0" max="100" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: '100%' }} />
    </div>
  );

  const latest = checks[0];

  return (
    <div style={{ padding: isPhone ? 14 : 30, maxWidth: 900, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Audit Readiness</h1>
        <button onClick={() => { setForm(EMPTY_FORM); setShowForm(!showForm); }} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ New Self-Check</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Periodically self-score your documentation, compliance, and reporting readiness — a running record that shows an auditor you monitor yourself.</p>

      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            ['Overall', latest.overall_score],
            ['Documentation', latest.documentation_score],
            ['Compliance', latest.compliance_score],
            ['Reporting', latest.reporting_score],
          ].map(([label, score]) => (
            <div key={label} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(score) }}>{score}</div>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: TEXT, fontSize: 15, marginTop: 0, marginBottom: 16 }}>New Self-Check</h2>
          <label style={labelStyle}>Check Date</label>
          <input type="date" value={form.check_date} onChange={e => setForm({ ...form, check_date: e.target.value })} style={inputStyle} />
          {scoreSlider('documentation_score', 'Documentation Score (client files complete, signed, up to date)')}
          {scoreSlider('compliance_score', 'Compliance Score (following your own program requirements)')}
          {scoreSlider('reporting_score', 'Reporting Score (court/funder reports submitted on time)')}
          <label style={labelStyle}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, minHeight: 70 }} placeholder="What needs attention before a real audit?" />

          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.04)', color: TEXT_MUTED, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 12, background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 15 }}>{saving ? 'Saving...' : 'Save Self-Check'}</button>
          </div>
        </div>
      )}

      {checks.length === 0 ? (
        <p style={{ color: TEXT_MUTED }}>No self-checks recorded yet.</p>
      ) : checks.map(c => (
        <div key={c.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{new Date(c.check_date).toLocaleDateString()}</p>
            <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold', background: `${scoreColor(c.overall_score)}22`, color: scoreColor(c.overall_score) }}>Overall: {c.overall_score}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: TEXT_MUTED }}>
            <span>Docs: {c.documentation_score}</span>
            <span>Compliance: {c.compliance_score}</span>
            <span>Reporting: {c.reporting_score}</span>
          </div>
          {c.notes && <p style={{ margin: '8px 0 0', fontSize: 13, color: TEXT_MUTED }}>{c.notes}</p>}
        </div>
      ))}
    </div>
  );
}
