import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { CARD_BG, ACCENT, GREEN, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';

const DOC_TYPES = ['Court Order', 'Signed Agreement', 'Drug Test Lab Result', 'Meeting Slip', 'Intake Form', 'Discharge Summary', 'Violation Report', 'Compliance Report', 'ID / Documentation', 'Other'];

export default function DocumentUpload({ clientId }) {
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(clientId || '');
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [docType, setDocType] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => { fetchDocuments(); fetchClients(); }, []);

  async function fetchDocuments() {
    const { data } = await supabase.from('documents').select('*, clients(name)').order('uploaded_at', { ascending: false });
    if (data) setDocuments(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  }

  async function handleUpload() {
    if (!file || !selectedClient || !docType) { setStatus('Please select a client, document type, and file.'); return; }
    setUploading(true);
    setStatus('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedClient}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('documents').insert([{
        client_id: selectedClient, provider_id: user.id,
        file_name: file.name, file_url: fileName,
        file_size: file.size, file_type: file.type,
        document_type: docType, notes
      }]);
      if (insertError) throw insertError;

      setStatus('✅ Document uploaded successfully!');
      setFile(null); setDocType(''); setNotes('');
      setShowForm(false);
      fetchDocuments();
    } catch (err) {
      setStatus('Upload failed: ' + err.message);
    }
    setUploading(false);
  }

  const fileIcons = { 'application/pdf': '📄', 'image/jpeg': '🖼️', 'image/png': '🖼️', 'default': '📎' };

  async function viewDocument(doc) {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_url, 300);
    if (error || !data?.signedUrl) { setStatus('Could not open document: ' + (error?.message || 'unknown error')); return; }
    window.open(data.signedUrl, '_blank');
  }

  const inputStyle = { width: '100%', padding: 12, marginBottom: 12, borderRadius: 8, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 14, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };

  return (
    <div style={{ padding: 30, maxWidth: 800, fontFamily: NAV_FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ color: TEXT, margin: 0 }}>Documents</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>+ Upload Document</button>
      </div>
      <p style={{ color: TEXT_MUTED, marginBottom: 24, fontSize: 14 }}>Upload court orders, signed agreements, drug test results, meeting slips, and other compliance documents.</p>

      {status && (
        <div style={{ background: status.includes('✅') ? 'rgba(76,175,125,0.12)' : 'rgba(248,113,113,0.1)', border: `0.5px solid ${status.includes('✅') ? GREEN : RED}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: status.includes('✅') ? GREEN : RED }}>{status}</div>
      )}

      {showForm && (
        <div style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 25, marginBottom: 20 }}>
          <h2 style={{ color: TEXT, marginBottom: 16, fontSize: 16 }}>Upload Document</h2>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={inputStyle}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={docType} onChange={e => setDocType(e.target.value)} style={inputStyle}>
            <option value="">Document Type *</option>
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
          <div
            style={{ border: `2px dashed ${ACCENT}`, borderRadius: 8, padding: 30, textAlign: 'center', marginBottom: 16, cursor: 'pointer', background: file ? 'rgba(91,155,240,0.1)' : 'rgba(255,255,255,0.02)' }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
            {file ? (
              <div><p style={{ margin: 0, color: ACCENT, fontWeight: 'bold' }}>📎 {file.name}</p><p style={{ margin: '4px 0 0', color: TEXT_MUTED, fontSize: 12 }}>{(file.size / 1024).toFixed(1)} KB</p></div>
            ) : (
              <div><p style={{ margin: 0, color: TEXT_MUTED, fontSize: 15 }}>📁 Click to select a file</p><p style={{ margin: '4px 0 0', color: TEXT_DIM, fontSize: 12 }}>PDF, JPG, PNG, DOC — max 10MB</p></div>
            )}
          </div>
          <button onClick={handleUpload} disabled={uploading || !file || !selectedClient || !docType} style={{ width: '100%', padding: 13, background: file && selectedClient && docType ? GREEN : 'rgba(255,255,255,0.08)', color: file && selectedClient && docType ? 'white' : TEXT_DIM, border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 'bold' }}>
            {uploading ? 'Uploading...' : '⬆️ Upload Document'}
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📁</p>
          <p>No documents uploaded yet.</p>
        </div>
      ) : documents.map(d => (
        <div key={d.id} style={{ background: CARD_BG, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 28 }}>{fileIcons[d.file_type] || fileIcons.default}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: TEXT }}>{d.file_name}</p>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: TEXT_MUTED }}>{d.clients?.name} — {d.document_type}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: TEXT_DIM }}>{new Date(d.uploaded_at).toLocaleDateString()} {d.file_size ? `• ${(d.file_size / 1024).toFixed(1)} KB` : ''}</p>
              {d.notes && <p style={{ margin: '4px 0 0', fontSize: 12, color: TEXT_MUTED }}>{d.notes}</p>}
            </div>
          </div>
          {d.file_url && (
            <button onClick={() => viewDocument(d)} style={{ padding: '8px 16px', background: ACCENT, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>View</button>
          )}
        </div>
      ))}
    </div>
  );
}
