import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const TEMPLATES = {
  navy_classic: {
    label: 'Navy Classic',
    swatch: '#1B3A6B',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
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
      <body>
      <div class="border"><div class="inner-border">
        <div class="seal">🏛️</div>
        <h1>CERTIFICATE OF COMPLETION</h1>
        <div class="subtitle">CourtBridge Solutions</div>
        <div class="presented">This certifies that</div>
        <div class="name">${name}</div>
        <div class="program">has successfully completed the</div>
        <div class="program"><strong>${program}</strong></div>
        ${sessionsLine ? `<div class="detail">${sessionsLine}</div>` : ''}
        ${checkinsLine ? `<div class="detail">${checkinsLine}</div>` : ''}
        <div class="date">Completion Date: <strong>${dateStr}</strong></div>
        <div class="sig-section">
          <div class="sig-line">${contactName}<br><span style="font-size:11px;color:#888">${orgName}</span></div>
          <div class="sig-line">Date Issued<br><span style="font-size:11px;color:#888">${issuedStr}</span></div>
        </div>
        <div class="cert-num">Certificate Number: ${certNum}</div>
      </div></div>
      </body>`,
  },
  gold_ornate: {
    label: 'Gold Ornate',
    swatch: '#A8842A',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        body{font-family:Georgia,serif;background:#FDFBF5;padding:50px;text-align:center;}
        .frame{border:3px double #A8842A;padding:44px;position:relative;}
        .corner{position:absolute;font-size:22px;color:#A8842A;}
        .eyebrow{color:#A8842A;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;}
        .rule{width:60px;height:2px;background:#A8842A;margin:0 auto 20px;}
        .presented{color:#3A3226;font-size:13px;margin-bottom:8px;font-style:italic;}
        .name{color:#2B2419;font-size:38px;font-weight:bold;margin-bottom:18px;}
        .body{color:#5A503F;font-size:14px;line-height:1.7;max-width:420px;margin:0 auto 22px;}
        .sig{display:flex;justify-content:space-around;margin-top:30px;}
        .sig div{border-top:1px solid #A8842A;padding-top:8px;width:200px;font-size:11px;color:#5A503F;}
        .certnum{margin-top:24px;font-size:11px;color:#A8842A;}
      </style>
      <body>
      <div class="frame">
        <div class="corner" style="top:8px;left:8px;">❧</div>
        <div class="corner" style="top:8px;right:8px;transform:scaleX(-1);">❧</div>
        <div class="corner" style="bottom:8px;left:8px;transform:scaleY(-1);">❧</div>
        <div class="corner" style="bottom:8px;right:8px;transform:scale(-1);">❧</div>
        <div class="eyebrow">Certificate of Achievement</div>
        <div class="rule"></div>
        <div class="presented">Presented with distinction to</div>
        <div class="name">${name}</div>
        <div class="body">for successful completion of the<br><strong>${program}</strong><br>on ${dateStr}${sessionsLine ? `<br>${sessionsLine}` : ''}${checkinsLine ? `<br>${checkinsLine}` : ''}</div>
        <div class="sig">
          <div>${contactName}, Provider</div>
          <div>${orgName}</div>
        </div>
        <div class="certnum">Certificate Number: ${certNum} · Issued ${issuedStr}</div>
      </div>
      </body>`,
  },
  modern_minimal: {
    label: 'Modern Minimal',
    swatch: '#16294D',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        body{font-family:'Segoe UI',-apple-system,sans-serif;background:#fff;padding:56px 60px;}
        .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:60px;}
        .bar{width:34px;height:4px;background:#1B3A6B;margin-bottom:14px;}
        .eyebrow{font-size:11px;font-weight:700;letter-spacing:0.1em;color:#8993A6;text-transform:uppercase;}
        .meta{text-align:right;font-size:11px;color:#8993A6;}
        .presented{font-size:13px;color:#8993A6;margin-bottom:6px;}
        .name{font-size:44px;font-weight:800;color:#16294D;margin-bottom:20px;letter-spacing:-0.5px;}
        .body{font-size:15px;color:#333;line-height:1.7;margin-bottom:50px;}
        .footer{display:flex;gap:60px;padding-top:20px;border-top:1px solid #E5E9F0;}
        .footer div div:first-child{font-size:10px;color:#8993A6;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;}
        .footer div div:last-child{font-size:13px;font-weight:600;}
      </style>
      <body>
      <div class="head">
        <div><div class="bar"></div><div class="eyebrow">Certificate of Completion</div></div>
        <div class="meta">${certNum}<br>Issued ${issuedStr}</div>
      </div>
      <div class="presented">This certifies that</div>
      <div class="name">${name}</div>
      <div class="body">has successfully completed<br><strong>${program}</strong>${sessionsLine || checkinsLine ? `<br>${[sessionsLine, checkinsLine].filter(Boolean).join(' · ')}` : ''}<br>Completed ${dateStr}</div>
      <div class="footer">
        <div><div>Provider</div><div>${contactName}</div></div>
        <div><div>Organization</div><div>${orgName}</div></div>
      </div>
      </body>`,
  },
  bold_ribbon: {
    label: 'Bold Ribbon',
    swatch: '#16294D',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        body{font-family:'Segoe UI',-apple-system,sans-serif;background:#fff;margin:0;padding:24px;}
        .card{background:#16294D;position:relative;overflow:hidden;border-radius:6px;}
        .ribbon{position:absolute;top:22px;right:-46px;background:#E4A733;color:#16294D;font-weight:800;font-size:12px;padding:6px 60px;transform:rotate(45deg);letter-spacing:0.05em;}
        .content{padding:56px 56px 44px;}
        .eyebrow{font-size:12px;font-weight:700;letter-spacing:0.1em;color:#7DA6E0;text-transform:uppercase;margin-bottom:18px;}
        .name{font-size:42px;font-weight:800;color:#fff;margin-bottom:8px;}
        .bar{width:50px;height:4px;background:#E4A733;margin-bottom:22px;}
        .body{font-size:15px;color:#C8D4E8;line-height:1.7;margin-bottom:0;}
        .footer{background:#10203D;padding:20px 56px;display:flex;justify-content:space-between;font-size:12px;color:#9FB2CE;}
      </style>
      <body>
      <div class="card">
        <div class="ribbon">COMPLETED</div>
        <div class="content">
          <div class="eyebrow">Certificate of Completion</div>
          <div class="name">${name}</div>
          <div class="bar"></div>
          <div class="body">Completed <strong style="color:#fff">${program}</strong><br>on ${dateStr}.${sessionsLine ? ` ${sessionsLine}.` : ''}${checkinsLine ? ` ${checkinsLine}.` : ''}</div>
        </div>
        <div class="footer"><span>${orgName}</span><span>${certNum}</span></div>
      </div>
      </body>`,
  },
};

export default function CompletionCertificate() {
  const [certificates, setCertificates] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ client_id: '', program_name: '', completion_date: new Date().toISOString().split('T')[0], total_sessions: '', total_checkins: '', template: 'navy_classic' });
  const [previewKey, setPreviewKey] = useState(null);

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
    setForm({ client_id: '', program_name: '', completion_date: new Date().toISOString().split('T')[0], total_sessions: '', total_checkins: '', template: 'navy_classic' });
    setShowForm(false);
    setSaving(false);
    fetchCertificates();
  }

  function sampleHtml(templateKey) {
    const tpl = TEMPLATES[templateKey] || TEMPLATES.navy_classic;
    return `<html><head><title>Preview</title></head>${tpl.body(
      'Jordan Michaels', 'Batterers Intervention Program (BIP)', 'July 27, 2026',
      'Total Sessions Completed: 26', 'Total Check-Ins: 180',
      profile?.contact_name || 'Provider Name', profile?.organization_name || 'Your Agency',
      new Date().toLocaleDateString(), 'CB-88431902'
    )}</html>`;
  }

  function printCertificate(cert) {
    const tpl = TEMPLATES[cert.template] || TEMPLATES.navy_classic;
    const name = escapeHtml(cert.clients?.name || '');
    const program = escapeHtml(cert.program_name);
    const dateStr = new Date(cert.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const sessionsLine = cert.total_sessions ? `Total Sessions Completed: ${cert.total_sessions}` : '';
    const checkinsLine = cert.total_checkins ? `Total Check-Ins: ${cert.total_checkins}` : '';
    const contactName = escapeHtml(profile?.contact_name || 'Provider');
    const orgName = escapeHtml(profile?.organization_name || '');
    const issuedStr = new Date(cert.issued_at).toLocaleDateString();
    const certNum = escapeHtml(cert.certificate_number);

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Completion Certificate</title></head>
      ${tpl.body(name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum)}
      </html>
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

          <label style={{ fontSize: 12, color: TEXT_MUTED, display: 'block', marginBottom: 8 }}>Certificate Design</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <div
                key={key}
                onClick={() => setForm({ ...form, template: key })}
                style={{
                  cursor: 'pointer', borderRadius: 8, padding: '10px 12px',
                  border: form.template === key ? `2px solid ${ACCENT}` : `0.5px solid ${BORDER}`,
                  background: form.template === key ? 'rgba(91,155,240,0.1)' : 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: tpl.swatch, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: TEXT }}>{tpl.label}</span>
                </div>
                <div
                  onClick={e => { e.stopPropagation(); setPreviewKey(key); }}
                  style={{ fontSize: 11, color: ACCENT, textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Preview →
                </div>
              </div>
            ))}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: (TEMPLATES[cert.template] || TEMPLATES.navy_classic).swatch, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{cert.clients?.name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 14, color: TEXT }}>{cert.program_name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXT_DIM }}>Completed: {new Date(cert.completion_date).toLocaleDateString()} • Cert #: {cert.certificate_number}</p>
              {cert.total_sessions && <p style={{ margin: '2px 0 0', fontSize: 12, color: TEXT_DIM }}>{cert.total_sessions} sessions • {cert.total_checkins} check-ins</p>}
            </div>
          </div>
          <button onClick={() => printCertificate(cert)} style={{ padding: '10px 18px', background: GREEN, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>🖨️ Print Certificate</button>
        </div>
      ))}

      {previewKey && (
        <div
          onClick={() => setPreviewKey(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,16,26,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: CARD_BG, borderRadius: 12, padding: 16, maxWidth: 700, width: '100%', border: `0.5px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{TEMPLATES[previewKey].label} — Preview</span>
              <button onClick={() => setPreviewKey(null)} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>
            <iframe
              title="Certificate preview"
              srcDoc={sampleHtml(previewKey)}
              style={{ width: '100%', height: 480, border: `0.5px solid ${BORDER}`, borderRadius: 8, background: 'white' }}
            />
            <button
              onClick={() => { setForm({ ...form, template: previewKey }); setPreviewKey(null); }}
              style={{ width: '100%', marginTop: 12, padding: 12, background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
            >
              Use This Design
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
