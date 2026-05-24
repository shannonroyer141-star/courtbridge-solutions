import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);

      await supabase.from('documents').insert([{
        client_id: selectedClient, provider_id: user.id,
        file_name: file.name, file_url: publicUrl,
        file_size: file.size, file_type: file.type,
        document_type: docType, notes
      }]);

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

  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ color: '#1B3A6B', margin: 0 }}>Documents</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#1B3A6B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>+ Upload Document</button>
      </div>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>Upload court orders, signed agreements, drug test results, meeting slips, and other compliance documents.</p>

      {status && <div style={{ background: status.includes('✅') ? '#d4edda' : '#fdecea', border: `1px solid ${status.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`, borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: status.includes('✅') ? '#155724' : '#721c24' }}>{status}</div>}

      {showForm && (
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '12px', padding: '25px', marginBottom: '20px' }}>
          <h2 style={{ color: '#1B3A6B', marginBottom: '16px', fontSize: '16px' }}>Upload Document</h2>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
            <option value="">Select Client *</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={docType} onChange={e => setDocType(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
            <option value="">Document Type *</option>
            {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', minHeight: '60px' }} />
          <div style={{ border: '2px dashed #1B3A6B', borderRadius: '8px', padding: '30px', textAlign: 'center', marginBottom: '16px', cursor: 'pointer', background: file ? '#e8f0fb' : 'white' }} onClick={() => document.getElementById('file-input').click()}>
            <input id="file-input" type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setFile(e.target.files[0])} />
            {file ? (
              <div><p style={{ margin: 0, color: '#1B3A6B', fontWeight: 'bold' }}>📎 {file.name}</p><p style={{ margin: '4px 0 0', color: '#666', fontSize: '12px' }}>{(file.size / 1024).toFixed(1)} KB</p></div>
            ) : (
              <div><p style={{ margin: 0, color: '#666', fontSize: '15px' }}>📁 Click to select a file</p><p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>PDF, JPG, PNG, DOC — max 10MB</p></div>
            )}
          </div>
          <button onClick={handleUpload} disabled={uploading || !file || !selectedClient || !docType} style={{ width: '100%', padding: '13px', background: file && selectedClient && docType ? '#27AE60' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
            {uploading ? 'Uploading...' : '⬆️ Upload Document'}
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p style={{ fontSize: '40px', marginBottom: '12px' }}>📁</p>
          <p>No documents uploaded yet.</p>
        </div>
      ) : documents.map(d => (
        <div key={d.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '10px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '28px' }}>{fileIcons[d.file_type] || fileIcons.default}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#1B3A6B' }}>{d.file_name}</p>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#666' }}>{d.clients?.name} — {d.document_type}</p>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>{new Date(d.uploaded_at).toLocaleDateString()} {d.file_size ? `• ${(d.file_size / 1024).toFixed(1)} KB` : ''}</p>
              {d.notes && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#555' }}>{d.notes}</p>}
            </div>
          </div>
          {d.file_url && (
            <a href={d.file_url} target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: '#1B3A6B', color: 'white', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', whiteSpace: 'nowrap' }}>View</a>
          )}
        </div>
      ))}
    </div>
  );
}
