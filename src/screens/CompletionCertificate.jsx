import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const PRINT_RESET = `
  @page{size:landscape;margin:0;}
  @media print{html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
  html,body{margin:0;}
`;

const TEMPLATES = {
  navy_classic: {
    label: 'Navy & Gold Classic',
    swatch: '#1B3A6B',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:Georgia,serif;background:#F4F1E9;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#FDFCF8;padding:0.5in;position:relative;}
        .border{border:3px solid #1B3A6B;height:100%;box-sizing:border-box;padding:0.35in;position:relative;}
        .border::before{content:'';position:absolute;inset:10px;border:1px solid #C9A646;}
        .inner{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 0.4in;}
        .seal{font-size:44px;margin-bottom:6px;}
        h1{color:#1B3A6B;font-size:34px;margin:0 0 6px;letter-spacing:3px;font-weight:normal;}
        .org{color:#C9A646;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin-bottom:32px;min-height:16px;}
        .presented{color:#555;font-size:15px;margin-bottom:10px;font-style:italic;}
        .name{color:#1B3A6B;font-size:44px;font-family:'Brush Script MT',cursive;border-bottom:1px solid #C9A646;display:inline-block;padding:0 20px 8px;margin-bottom:16px;}
        .program{color:#333;font-size:17px;margin-bottom:4px;}
        .detail{color:#666;font-size:12px;margin-bottom:3px;}
        .date{color:#444;font-size:14px;margin-top:14px;}
        .sig-section{display:flex;justify-content:space-around;width:100%;max-width:520px;margin-top:36px;}
        .sig-line{border-top:1px solid #999;padding-top:6px;font-size:12px;color:#555;text-align:center;}
        .cert-num{color:#999;font-size:10px;margin-top:22px;letter-spacing:1px;}
      </style>
      <body><div class="page"><div class="border"><div class="inner">
        <div class="seal">🏛️</div>
        <h1>CERTIFICATE OF COMPLETION</h1>
        <div class="org">${orgName}</div>
        <div class="presented">This certifies that</div>
        <div class="name">${name}</div>
        <div class="program">has successfully completed the</div>
        <div class="program"><strong>${program}</strong></div>
        ${sessionsLine ? `<div class="detail">${sessionsLine}</div>` : ''}
        ${checkinsLine ? `<div class="detail">${checkinsLine}</div>` : ''}
        <div class="date">Completion Date: <strong>${dateStr}</strong></div>
        <div class="sig-section">
          <div class="sig-line">${contactName}<br><span style="font-size:10px;color:#999">Program Contact</span></div>
          <div class="sig-line">${issuedStr}<br><span style="font-size:10px;color:#999">Date Issued</span></div>
        </div>
        <div class="cert-num">CERTIFICATE NO. ${certNum}</div>
      </div></div></div></body>`,
  },
  ivory_elegant: {
    label: 'Ivory Elegant',
    swatch: '#A8842A',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:Georgia,serif;background:#EFEAE0;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#FDFBF5;padding:0.55in;position:relative;}
        .frame{border:2px double #A8842A;height:100%;box-sizing:border-box;padding:0.4in 0.6in;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
        .corner{position:absolute;font-size:26px;color:#A8842A;}
        .eyebrow{color:#A8842A;font-size:12px;letter-spacing:5px;text-transform:uppercase;margin-bottom:10px;}
        .org{color:#8A6A1E;font-size:13px;letter-spacing:2px;margin-bottom:26px;min-height:16px;}
        .rule{width:70px;height:2px;background:#A8842A;margin:0 0 24px;}
        .presented{color:#3A3226;font-size:14px;margin-bottom:10px;font-style:italic;}
        .name{color:#2B2419;font-size:42px;font-weight:bold;margin-bottom:22px;}
        .body{color:#5A503F;font-size:15px;line-height:1.8;max-width:560px;margin:0 auto 26px;}
        .sig{display:flex;justify-content:space-around;width:100%;max-width:560px;margin-top:20px;}
        .sig div{border-top:1px solid #A8842A;padding-top:8px;font-size:12px;color:#5A503F;}
        .certnum{margin-top:26px;font-size:11px;color:#A8842A;letter-spacing:1px;}
      </style>
      <body><div class="page"><div class="frame">
        <div class="corner" style="top:14px;left:14px;">❧</div>
        <div class="corner" style="top:14px;right:14px;transform:scaleX(-1);">❧</div>
        <div class="corner" style="bottom:14px;left:14px;transform:scaleY(-1);">❧</div>
        <div class="corner" style="bottom:14px;right:14px;transform:scale(-1);">❧</div>
        <div class="eyebrow">Certificate of Achievement</div>
        <div class="org">${orgName}</div>
        <div class="rule"></div>
        <div class="presented">Presented with distinction to</div>
        <div class="name">${name}</div>
        <div class="body">for successful completion of the<br><strong>${program}</strong><br>on ${dateStr}${sessionsLine ? `<br>${sessionsLine}` : ''}${checkinsLine ? `<br>${checkinsLine}` : ''}</div>
        <div class="sig">
          <div>${contactName}<br><span style="font-size:10px;color:#8A7A5E">Program Contact</span></div>
          <div>${issuedStr}<br><span style="font-size:10px;color:#8A7A5E">Date Issued</span></div>
        </div>
        <div class="certnum">CERTIFICATE NO. ${certNum}</div>
      </div></div></body>`,
  },
  modern_minimal: {
    label: 'Modern Minimal',
    swatch: '#16294D',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:'Segoe UI',-apple-system,sans-serif;background:#E8EBF0;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#fff;padding:0.6in 0.75in;display:flex;flex-direction:column;}
        .head{display:flex;justify-content:space-between;align-items:flex-start;}
        .bar{width:40px;height:5px;background:#1B3A6B;margin-bottom:16px;}
        .eyebrow{font-size:12px;font-weight:700;letter-spacing:0.12em;color:#8993A6;text-transform:uppercase;}
        .org{font-size:15px;font-weight:700;color:#16294D;margin-top:4px;}
        .meta{text-align:right;font-size:12px;color:#8993A6;}
        .body-wrap{flex:1;display:flex;flex-direction:column;justify-content:center;}
        .presented{font-size:14px;color:#8993A6;margin-bottom:8px;}
        .name{font-size:56px;font-weight:800;color:#16294D;margin-bottom:22px;letter-spacing:-1px;}
        .body{font-size:17px;color:#333;line-height:1.8;}
        .footer{display:flex;gap:70px;padding-top:22px;border-top:1px solid #E5E9F0;}
        .footer div div:first-child{font-size:10px;color:#8993A6;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;}
        .footer div div:last-child{font-size:14px;font-weight:600;color:#16294D;}
      </style>
      <body><div class="page">
        <div class="head">
          <div><div class="bar"></div><div class="eyebrow">Certificate of Completion</div><div class="org">${orgName}</div></div>
          <div class="meta">${certNum}<br>Issued ${issuedStr}</div>
        </div>
        <div class="body-wrap">
          <div class="presented">This certifies that</div>
          <div class="name">${name}</div>
          <div class="body">has successfully completed<br><strong>${program}</strong>${sessionsLine || checkinsLine ? `<br>${[sessionsLine, checkinsLine].filter(Boolean).join(' · ')}` : ''}<br>Completed ${dateStr}</div>
        </div>
        <div class="footer">
          <div><div>Program Contact</div><div>${contactName}</div></div>
        </div>
      </div></body>`,
  },
  bold_ribbon: {
    label: 'Bold Achievement',
    swatch: '#16294D',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:'Segoe UI',-apple-system,sans-serif;background:#0B1526;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#16294D;position:relative;overflow:hidden;display:flex;flex-direction:column;}
        .ribbon{position:absolute;top:30px;right:-58px;background:#E4A733;color:#16294D;font-weight:800;font-size:13px;padding:7px 80px;transform:rotate(45deg);letter-spacing:0.06em;}
        .content{flex:1;padding:0.7in 0.9in;display:flex;flex-direction:column;justify-content:center;}
        .eyebrow{font-size:13px;font-weight:700;letter-spacing:0.12em;color:#7DA6E0;text-transform:uppercase;margin-bottom:6px;}
        .org{font-size:15px;color:#C8D4E8;margin-bottom:22px;min-height:18px;}
        .name{font-size:52px;font-weight:800;color:#fff;margin-bottom:10px;}
        .bar{width:60px;height:5px;background:#E4A733;margin-bottom:26px;}
        .body{font-size:17px;color:#C8D4E8;line-height:1.8;max-width:680px;}
        .footer{background:#10203D;padding:22px 0.9in;display:flex;justify-content:space-between;font-size:13px;color:#9FB2CE;}
      </style>
      <body><div class="page">
        <div class="ribbon">COMPLETED</div>
        <div class="content">
          <div class="eyebrow">Certificate of Completion</div>
          <div class="org">${orgName}</div>
          <div class="name">${name}</div>
          <div class="bar"></div>
          <div class="body">Completed <strong style="color:#fff">${program}</strong> on ${dateStr}.${sessionsLine ? ` ${sessionsLine}.` : ''}${checkinsLine ? ` ${checkinsLine}.` : ''}</div>
        </div>
        <div class="footer"><span>${contactName}</span><span>Certificate No. ${certNum}</span></div>
      </div></body>`,
  },
  emerald_formal: {
    label: 'Emerald Formal',
    swatch: '#1E4D3A',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:Georgia,serif;background:#EEF1EC;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#FBFBF8;padding:0.5in;}
        .border{border:3px solid #1E4D3A;height:100%;box-sizing:border-box;padding:0.4in;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
        .border::before{content:'';position:absolute;inset:9px;border:1px solid #C9A646;}
        .seal{font-size:42px;margin-bottom:8px;}
        h1{color:#1E4D3A;font-size:32px;margin:0 0 6px;letter-spacing:3px;font-weight:normal;}
        .org{color:#C9A646;font-size:13px;text-transform:uppercase;letter-spacing:3px;margin-bottom:30px;min-height:16px;}
        .presented{color:#555;font-size:14px;margin-bottom:10px;font-style:italic;}
        .name{color:#1E4D3A;font-size:44px;font-weight:bold;margin-bottom:18px;}
        .program{color:#333;font-size:17px;margin-bottom:4px;}
        .detail{color:#666;font-size:12px;margin-bottom:3px;}
        .date{color:#444;font-size:14px;margin-top:14px;}
        .sig-section{display:flex;justify-content:space-around;width:100%;max-width:520px;margin-top:34px;}
        .sig-line{border-top:1px solid #999;padding-top:6px;font-size:12px;color:#555;}
        .cert-num{color:#999;font-size:10px;margin-top:20px;letter-spacing:1px;}
      </style>
      <body><div class="page"><div class="border">
        <div class="seal">🌿</div>
        <h1>CERTIFICATE OF COMPLETION</h1>
        <div class="org">${orgName}</div>
        <div class="presented">This certifies that</div>
        <div class="name">${name}</div>
        <div class="program">has successfully completed the</div>
        <div class="program"><strong>${program}</strong></div>
        ${sessionsLine ? `<div class="detail">${sessionsLine}</div>` : ''}
        ${checkinsLine ? `<div class="detail">${checkinsLine}</div>` : ''}
        <div class="date">Completion Date: <strong>${dateStr}</strong></div>
        <div class="sig-section">
          <div class="sig-line">${contactName}<br><span style="font-size:10px;color:#999">Program Contact</span></div>
          <div class="sig-line">${issuedStr}<br><span style="font-size:10px;color:#999">Date Issued</span></div>
        </div>
        <div class="cert-num">CERTIFICATE NO. ${certNum}</div>
      </div></div></body>`,
  },
  burgundy_heritage: {
    label: 'Burgundy Heritage',
    swatch: '#6B1F2A',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:'Palatino Linotype',Georgia,serif;background:#F0E9E4;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#FBF6F2;padding:0.55in;position:relative;}
        .frame{border-top:6px solid #6B1F2A;border-bottom:6px solid #6B1F2A;height:100%;box-sizing:border-box;padding:0.5in 0.6in;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
        .ribbon-icon{font-size:38px;margin-bottom:10px;}
        .eyebrow{color:#6B1F2A;font-size:12px;letter-spacing:5px;text-transform:uppercase;margin-bottom:8px;}
        .org{color:#8B4A52;font-size:13px;letter-spacing:2px;margin-bottom:28px;min-height:16px;}
        .presented{color:#4A3B38;font-size:14px;margin-bottom:10px;font-style:italic;}
        .name{color:#3A2A28;font-size:44px;font-weight:bold;margin-bottom:20px;}
        .body{color:#5A4B48;font-size:15px;line-height:1.8;max-width:560px;margin:0 auto 26px;}
        .sig{display:flex;justify-content:space-around;width:100%;max-width:560px;margin-top:20px;}
        .sig div{border-top:1px solid #B08A87;padding-top:8px;font-size:12px;color:#5A4B48;}
        .certnum{margin-top:26px;font-size:11px;color:#8B4A52;letter-spacing:1px;}
      </style>
      <body><div class="page"><div class="frame">
        <div class="ribbon-icon">🎗️</div>
        <div class="eyebrow">Certificate of Completion</div>
        <div class="org">${orgName}</div>
        <div class="presented">Presented to</div>
        <div class="name">${name}</div>
        <div class="body">for successful completion of<br><strong>${program}</strong><br>on ${dateStr}${sessionsLine ? `<br>${sessionsLine}` : ''}${checkinsLine ? `<br>${checkinsLine}` : ''}</div>
        <div class="sig">
          <div>${contactName}<br><span style="font-size:10px;color:#8B6A67">Program Contact</span></div>
          <div>${issuedStr}<br><span style="font-size:10px;color:#8B6A67">Date Issued</span></div>
        </div>
        <div class="certnum">CERTIFICATE NO. ${certNum}</div>
      </div></div></body>`,
  },
  slate_corporate: {
    label: 'Slate Corporate',
    swatch: '#3D4753',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:'Segoe UI',-apple-system,sans-serif;background:#DDE1E6;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#fff;display:flex;}
        .side{width:2.2in;background:#3D4753;color:#fff;padding:0.6in 0.4in;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;}
        .badge{font-size:44px;}
        .side .org{font-size:13px;font-weight:700;line-height:1.4;}
        .side .certnum{font-size:10px;color:#AEB6C0;letter-spacing:1px;}
        .main{flex:1;padding:0.7in 0.75in;display:flex;flex-direction:column;justify-content:center;}
        .eyebrow{font-size:12px;font-weight:700;letter-spacing:0.12em;color:#8993A6;text-transform:uppercase;margin-bottom:10px;}
        .name{font-size:50px;font-weight:800;color:#232C36;margin-bottom:20px;letter-spacing:-1px;}
        .body{font-size:16px;color:#333;line-height:1.8;margin-bottom:30px;}
        .footer{display:flex;gap:60px;padding-top:20px;border-top:1px solid #E5E9F0;}
        .footer div div:first-child{font-size:10px;color:#8993A6;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;}
        .footer div div:last-child{font-size:14px;font-weight:600;color:#232C36;}
      </style>
      <body><div class="page">
        <div class="side">
          <div class="badge">✔️</div>
          <div class="org">${orgName}</div>
          <div class="certnum">CERT NO. ${certNum}<br>ISSUED ${issuedStr}</div>
        </div>
        <div class="main">
          <div class="eyebrow">Certificate of Completion</div>
          <div class="name">${name}</div>
          <div class="body">has successfully completed <strong>${program}</strong><br>${[sessionsLine, checkinsLine].filter(Boolean).join(' · ')}${sessionsLine || checkinsLine ? '<br>' : ''}Completed ${dateStr}</div>
          <div class="footer">
            <div><div>Program Contact</div><div>${contactName}</div></div>
          </div>
        </div>
      </div></body>`,
  },
  terracotta_warm: {
    label: 'Terracotta Warm',
    swatch: '#C1653B',
    body: (name, program, dateStr, sessionsLine, checkinsLine, contactName, orgName, issuedStr, certNum) => `
      <style>
        ${PRINT_RESET}
        body{font-family:Georgia,serif;background:#F3E7DC;display:flex;align-items:center;justify-content:center;}
        .page{width:11in;height:8.5in;box-sizing:border-box;background:#FDF8F3;padding:0.55in;position:relative;}
        .frame{border-radius:16px;border:2px solid #C1653B;height:100%;box-sizing:border-box;padding:0.5in;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
        .badge{width:64px;height:64px;border-radius:50%;background:#C1653B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:30px;margin-bottom:14px;}
        .eyebrow{color:#C1653B;font-size:12px;letter-spacing:4px;text-transform:uppercase;margin-bottom:8px;}
        .org{color:#A9673F;font-size:13px;margin-bottom:26px;min-height:16px;}
        .name{color:#5C3A28;font-size:42px;font-weight:bold;margin-bottom:18px;}
        .body{color:#6B5240;font-size:15px;line-height:1.8;max-width:560px;margin:0 auto 24px;}
        .sig{display:flex;justify-content:space-around;width:100%;max-width:520px;margin-top:20px;}
        .sig div{border-top:1px solid #D9A683;padding-top:8px;font-size:12px;color:#6B5240;}
        .certnum{margin-top:24px;font-size:11px;color:#C1653B;letter-spacing:1px;}
      </style>
      <body><div class="page"><div class="frame">
        <div class="badge">★</div>
        <div class="eyebrow">Certificate of Completion</div>
        <div class="org">${orgName}</div>
        <div class="name">${name}</div>
        <div class="body">has successfully completed<br><strong>${program}</strong><br>on ${dateStr}${sessionsLine ? `<br>${sessionsLine}` : ''}${checkinsLine ? `<br>${checkinsLine}` : ''}</div>
        <div class="sig">
          <div>${contactName}<br><span style="font-size:10px;color:#A9836F">Program Contact</span></div>
          <div>${issuedStr}<br><span style="font-size:10px;color:#A9836F">Date Issued</span></div>
        </div>
        <div class="certnum">CERTIFICATE NO. ${certNum}</div>
      </div></div></body>`,
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
            <option value="" style={{ background: '#1E2A3A', color: '#fff' }}>Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id} style={{ background: '#1E2A3A', color: '#fff' }}>{c.name}</option>)}
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
