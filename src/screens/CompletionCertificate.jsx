import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default function CompletionCertificate() {
  const [certificates, setCertificates] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ client_id: '', program_name: '', completion_date: new Date().toISOString().split('T')[0], total_sessions: '', total_checkins: '' });

  useEffect(() => { fetchCertificates(); fetchClients(); fetchProfile(); }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  }

  async function fetchCertificates() {
    const { data } = await supabase.from('completion_certificates').select('*, clients(name)').order('created_at', { ascending: false });
    if (data) setCertificates(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const { data: { user } } = await supabase.auth.getUser();
    const certNumber = `CB-${Date.now().toString().slice(-8)}`;
    const { error } = await supabase.from('completion_certificates').insert([{ ...form, provider_id: user.id, certificate_number: certNumber, issued_at: new Date().toISOString() }]);
    if (error) {
      setSaveError('Could not issue certificate: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ client_id: '', program_name: '', completion_date: new Date().toISOString().split('T')[0], total_sessions: '', total_checkins: '' });
    setShowForm(false);
    setSaving(false);
    fetchCertificates();
  }

  function printCertificate(cert) {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Completion Certificate</title>
      <style>
        body{font-family:Georgia,serif;padding:60px;max-width:750px;margin:0 auto;background:white;}
        .border{border:8px solid #1B3A6B;padding:50px;text-align:center;}
        .inner-border{border:2px solid #1B3A6B;padding:40px;}
        h1{color:#1B3A6B;font-size:32px;margin-bottom:8px;letter-spacing:2px;}
        .subtitle{color:#666;font-size:14px;text-transform:uppercase;letter-spacing:3px;margin-bottom:40px;}
        .presented{color:#444;font-size:16px;margin-bottom:8px;}
        .name{color:#1B3A6B;font-size:42px;font-style:italic;border-bottom:2px solid #1B3A6B;display:inline-block;padding-bottom:4px;margin-bottom:20px;}
        .program{color:#333;font-size:18px;margin-bottom:8px;}
        .detail{color:#555;font-size:14px;margin-bottom:4px;}
        .date{color:#444;font-size:16px;margin:20px 0;}
        .cert-num{color:#888;font-size:12px;margin-top:30px;}
        .sig-section{display:flex;justify-content:space-around;margin-top:40px;}
        .sig-line{border-top:1px solid #333;width:200px;padding-top:8px;font-size:13px;color:#555;}
        .seal{font-size:60px;margin:20px 0;}
      </style>
      </head><body>
      <div class="border"><div class="inner-border">
        <div class="seal">🏛️</div>
        <h1>CERTIFICATE OF COMPLETION</h1>
        <div class="subtitle">CourtBridge Solutions</div>
        <div class="presented">This certifies that</div>
        <div class="name">${escapeHtml(cert.clients?.name || '')}</div>
        <div class="program">has successfully completed the</div>
        <div class="program"><strong>${escapeHtml(cert.program_name)}</strong></div>
        ${cert.total_sessions ? `<div class="detail">Total Sessions Completed: ${cert.total_sessions}</div>` : ''}
        ${cert.total_checkins ? `<div class="detail">Total Check-Ins: ${cert.total_checkins}</div>` : ''}
        <div class="date">Completion Date: <strong>${new Date(cert.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
        <div class="sig-section">
          <div class="sig-line">${escapeHtml(profile?.contact_name || 'Provider')}<br><span style="font-size:11px;color:#888">${escapeHtml(profile?.organization_name || '')}</span></div>
          <div class="sig-line">Date Issued<br><span style="font-size:11px;color:#888">${new Date(cert.issued_at).toLocaleDateString()}</span></div>
        </div>
        <div class="cert-num">Certificate Number: ${cert.certificate_number}</div>
      </div></div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Completion Certificates</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>🎓 Issue Certificate</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Generate professional completion certificates for clients who finish their program. Print and submit to the court.</p>

      {showForm && (
        <div style={{ background: CARD_BG, border: `2px solid ${GREEN}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: GREEN, marginBottom: 16, fontSize: 16 }}>🎓 Issue Completion Certificate</h2>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} style={inputStyle}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Program Name *" value={form.program_name} onChange={e => setForm({...form, program_name: e.target.value})} style={inputStyle} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: TEXT_MUTED, display: 'block', marginBottom: 4 }}>Completion Date</label>
              <input type="date" value={form.completion_date} onChange={e => setForm({...form, completion_date: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: TEXT_MUTED, display: 'block', marginBottom: 4 }}>Total Sessions</label>
              <input type="number" placeholder="e.g. 26" value={form.total_sessions} onChange={e => setForm({...form, total_sessions: e.target.value})} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: TEXT_MUTED, display: 'block', marginBottom: 4 }}>Total Check-Ins</label>
              <input type="number" placeholder="e.g. 180" value={form.total_checkins} onChange={e => setForm({...form, total_checkins: e.target.value})} style={inputStyle} />
            </div>
          </div>
          {saveError && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{saveError}</div>}
          <button onClick={handleSave} disabled={saving || !form.client_id || !form.program_name} style={{ width: '100%', padding: 13, background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' }}>
            {saving ? 'Saving...' : '🎓 Issue Certificate'}
          </button>
        </div>
      )}

      {certificates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎓</p>
          <p>No certificates issued yet.</p>
        </div>
      ) : certificates.map(cert => (
        <div key={cert.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{cert.clients?.name}</p>
            <p style={{ margin: '3px 0 0', fontSize: 14, color: TEXT }}>{cert.program_name}</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXT_DIM }}>Completed: {new Date(cert.completion_date).toLocaleDateString()} • Cert #: {cert.certificate_number}</p>
            {cert.total_sessions && <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXT_DIM }}>{cert.total_sessions} sessions • {cert.total_checkins} check-ins</p>}
          </div>
          <button onClick={() => printCertificate(cert)} style={{ padding: '10px 18px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>🖨️ Print Certificate</button>
        </div>
      ))}
    </div>
  );
}
