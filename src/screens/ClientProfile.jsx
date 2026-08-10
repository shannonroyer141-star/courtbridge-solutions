import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { syncClientBilling } from '../billing';
import { CARD_BG, ACCENT, GREEN, WARNING, RED, TEXT, TEXT_MUTED, TEXT_DIM, BORDER, NAV_FONT } from '../theme';
import { NotesWarning, FlagRestrictedButton } from '../components/VictimInfoWarning';

export default function ClientProfile({ clientId, onNavigate }) {
  const [client, setClient] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [courtDates, setCourtDates] = useState([]);
  const [drugTests, setDrugTests] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ order_name: '', order_type: 'primary', start_date: new Date().toISOString().split('T')[0], duration_weeks: '' });
  const [savingOrder, setSavingOrder] = useState(false);
  const [progressNotes, setProgressNotes] = useState([]);
  const [showAddNote, setShowAddNote] = useState(null);
  const [noteForm, setNoteForm] = useState({ note_date: new Date().toISOString().split('T')[0], content: '', visible_to_client: true, client_program_id: '' });
  const [savingNote, setSavingNote] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [showReactivate, setShowReactivate] = useState(false);
  const [returnForm, setReturnForm] = useState({ address: '', phone: '' });
  const [savingStatus, setSavingStatus] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (clientId) fetchAll();
  }, [clientId]);

  useEffect(() => {
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isPhone = width < 640;

  async function fetchAll() {
    setLoading(true);
    const [{ data: c }, { data: ci }, { data: cd }, { data: dt }, { data: cp }, { data: cm }, { data: pn }, { data: sg }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('checkins').select('*').eq('client_id', clientId).order('checked_in_at', { ascending: false }).limit(7),
      supabase.from('court_dates').select('*').eq('client_id', clientId).order('hearing_date', { ascending: true }).limit(3),
      supabase.from('drug_tests').select('*').eq('client_id', clientId).order('test_date', { ascending: false }).limit(3),
      supabase.from('client_programs').select('*').eq('client_id', clientId).order('created_at'),
      supabase.from('client_milestones').select('*').eq('client_id', clientId).order('achieved_at', { ascending: false }),
      supabase.from('client_progress_notes').select('*').eq('client_id', clientId).order('note_date', { ascending: false }),
      supabase.from('form_signatures').select('*').eq('client_id', clientId).order('signed_at', { ascending: false }),
    ]);
    setClient(c);
    setCheckIns(ci || []);
    setCourtDates(cd || []);
    setDrugTests(dt || []);
    setPrograms(cp || []);
    setMilestones(cm || []);
    setProgressNotes(pn || []);
    setSignatures(sg || []);
    setLoading(false);
  }

  async function addProgressNote() {
    if (!noteForm.content.trim()) return;
    setSavingNote(true);
    setActionError(null);
    const { error } = await supabase.from('client_progress_notes').insert({
      client_id: clientId,
      note_date: noteForm.note_date,
      content: noteForm.content.trim(),
      visible_to_client: noteForm.visible_to_client,
      client_program_id: noteForm.client_program_id || null,
    });
    if (error) {
      setActionError('Could not save note: ' + error.message);
      setSavingNote(false);
      return;
    }
    setNoteForm({ note_date: new Date().toISOString().split('T')[0], content: '', visible_to_client: true, client_program_id: '' });
    setShowAddNote(false);
    setSavingNote(false);
    fetchAll();
  }

  async function deleteProgressNote(id) {
    setActionError(null);
    const { error } = await supabase.from('client_progress_notes').delete().eq('id', id);
    if (error) { setActionError('Could not delete note: ' + error.message); return; }
    fetchAll();
  }

  async function addOrder() {
    if (!orderForm.order_name.trim()) return;
    setSavingOrder(true);
    setActionError(null);
    const { error } = await supabase.from('client_programs').insert({
      client_id: clientId,
      order_name: orderForm.order_name.trim(),
      order_type: orderForm.order_type,
      start_date: orderForm.start_date,
      duration_weeks: orderForm.duration_weeks ? parseInt(orderForm.duration_weeks, 10) : null,
    });
    if (error) {
      setActionError('Could not save order: ' + error.message);
      setSavingOrder(false);
      return;
    }
    setOrderForm({ order_name: '', order_type: 'primary', start_date: new Date().toISOString().split('T')[0], duration_weeks: '' });
    setShowAddOrder(false);
    setSavingOrder(false);
    fetchAll();
  }

  async function markComplete(program) {
    setActionError(null);
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase.from('client_programs').update({ status: 'completed', completed_at: completedAt }).eq('id', program.id);
    if (updateError) { setActionError('Could not mark complete: ' + updateError.message); return; }

    const { error: milestoneError } = await supabase.from('client_milestones').insert({
      client_id: clientId,
      milestone_type: `program_completed_${program.id}`,
      title: `Completed: ${program.order_name}`,
      description: `Successfully completed ${program.order_name}.`,
    });
    if (milestoneError) { setActionError('Marked complete, but the milestone badge failed to save: ' + milestoneError.message); }

    const { count: totalCheckins } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('checked_in_at', program.start_date);

    const { data: { user } } = await supabase.auth.getUser();
    const { error: certError } = await supabase.from('completion_certificates').insert({
      client_id: clientId,
      provider_id: user.id,
      program_name: program.order_name,
      completion_date: completedAt.split('T')[0],
      total_checkins: totalCheckins || 0,
      certificate_number: `CB-${Date.now().toString().slice(-8)}`,
      issued_at: completedAt,
    });
    if (certError) { setActionError('Marked complete, but the certificate failed to generate: ' + certError.message); }

    fetchAll();
  }

  async function markTerminated(program) {
    setActionError(null);
    const { error } = await supabase.from('client_programs').update({ status: 'terminated', completed_at: new Date().toISOString() }).eq('id', program.id);
    if (error) { setActionError('Could not update status: ' + error.message); return; }
    fetchAll();
  }

  async function changeClientStatus(newStatus) {
    setSavingStatus(true);
    setActionError(null);
    const { error } = await supabase.from('clients').update({ status: newStatus, status_changed_at: new Date().toISOString() }).eq('id', clientId);
    if (error) { setActionError('Could not update status: ' + error.message); }
    else { syncClientBilling(client?.provider_id); }
    setSavingStatus(false);
    fetchAll();
  }

  function startReactivation() {
    setReturnForm({ address: client.address || '', phone: client.phone || '' });
    setShowReactivate(true);
  }

  async function confirmReactivation() {
    setSavingStatus(true);
    setActionError(null);
    const { error } = await supabase.from('clients').update({
      status: 'active',
      status_changed_at: new Date().toISOString(),
      address: returnForm.address || null,
      phone: returnForm.phone || null,
    }).eq('id', clientId);
    if (error) { setActionError('Could not reactivate: ' + error.message); setSavingStatus(false); return; }
    syncClientBilling(client?.provider_id);
    setSavingStatus(false);
    setShowReactivate(false);
    fetchAll();
  }

  function getStatusColor(status) {
    if (status === 'active') return GREEN;
    if (status === 'at_risk') return RED;
    return WARNING;
  }

  const cardStyle = { background: CARD_BG, borderRadius: 12, padding: isPhone ? '16px' : '20px', marginBottom: 16, border: `0.5px solid ${BORDER}` };
  const inputStyle = { width: '100%', padding: 10, marginBottom: 8, borderRadius: 6, border: `0.5px solid ${BORDER}`, boxSizing: 'border-box', fontSize: 13, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT };
  const subCardStyle = { background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: 14, marginBottom: 14 };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, fontFamily: NAV_FONT }}>Loading client...</div>;
  if (!client) return (
    <div style={{ padding: 40, textAlign: 'center', color: TEXT_MUTED, fontFamily: NAV_FONT }}>
      No client selected.
      {onNavigate && <div style={{ marginTop: 12 }}><button onClick={() => onNavigate('clients')} style={{ background: 'none', border: 'none', color: ACCENT, fontWeight: 600, cursor: 'pointer' }}>← Back to Clients</button></div>}
    </div>
  );

  return (
    <div style={{ padding: isPhone ? 14 : 24, maxWidth: 800, fontFamily: NAV_FONT }}>
      {onNavigate && (
        <button onClick={() => onNavigate('clients')} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14 }}>← Back to Clients</button>
      )}
      {actionError && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: `0.5px solid ${RED}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: RED }}>{actionError}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 22, fontWeight: 'bold', flexShrink: 0 }}>
          {(client.name || client.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: TEXT }}>{client.name || client.email}</h2>
          <span style={{ background: getStatusColor(client.status), color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
            {client.status || 'Pending'}
          </span>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', color: TEXT, fontSize: 15 }}>Status</h3>
        {client.status_changed_at && (
          <p style={{ margin: '0 0 12px', fontSize: 12, color: TEXT_DIM }}>Last changed {new Date(client.status_changed_at).toLocaleDateString()}</p>
        )}
        {(client.status === 'terminated' || client.status === 'inactive') ? (
          <>
            <button onClick={startReactivation} style={{ padding: '8px 16px', background: GREEN, color: 'white', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              ↩ Reactivate — Client Returning
            </button>
            {showReactivate && (
              <div style={subCardStyle}>
                <p style={{ margin: '0 0 10px', fontSize: 13, color: TEXT }}>Welcome them back — no need to redo full intake. Just confirm what's likely changed:</p>
                <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Address</label>
                <input value={returnForm.address} onChange={e => setReturnForm({ ...returnForm, address: e.target.value })} style={inputStyle} />
                <label style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Phone</label>
                <input value={returnForm.phone} onChange={e => setReturnForm({ ...returnForm, phone: e.target.value })} style={{ ...inputStyle, marginBottom: 12 }} />
                <button onClick={confirmReactivation} disabled={savingStatus} style={{ width: '100%', padding: 10, background: GREEN, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {savingStatus ? 'Saving...' : 'Confirm Return — Set Active'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => changeClientStatus('inactive')} disabled={savingStatus} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', color: WARNING, border: `0.5px solid ${BORDER}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Mark Inactive</button>
            <button onClick={() => changeClientStatus('terminated')} disabled={savingStatus} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', color: RED, border: `0.5px solid ${BORDER}`, borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>Terminate</button>
          </div>
        )}
        <p style={{ fontSize: 11, color: TEXT_DIM, marginTop: 10, marginBottom: 0 }}>Terminating never deletes anything — check-ins, messages, documents, and Journey history all stay intact for if they come back.</p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, color: TEXT, fontSize: 15 }}>Journey — Court Orders & Programs</h3>
          <button onClick={() => setShowAddOrder(!showAddOrder)} style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>+ Add Order</button>
        </div>

        {showAddOrder && (
          <div style={subCardStyle}>
            <input placeholder="Order name (e.g. 52-Week Drug Court Program)" value={orderForm.order_name}
              onChange={e => setOrderForm({ ...orderForm, order_name: e.target.value })} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, flexDirection: isPhone ? 'column' : 'row' }}>
              <select value={orderForm.order_type} onChange={e => setOrderForm({ ...orderForm, order_type: e.target.value })}
                style={{ flex: 1, padding: 10, borderRadius: 6, border: `0.5px solid ${BORDER}`, fontSize: 13, background: CARD_BG, color: TEXT, fontFamily: NAV_FONT }}>
                <option value="primary">Primary order</option>
                <option value="accompanying">Accompanying order</option>
              </select>
              <input type="date" value={orderForm.start_date} onChange={e => setOrderForm({ ...orderForm, start_date: e.target.value })}
                style={{ flex: 1, padding: 10, borderRadius: 6, border: `0.5px solid ${BORDER}`, fontSize: 13, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }} />
              <input type="number" placeholder="Duration (weeks, optional)" value={orderForm.duration_weeks}
                onChange={e => setOrderForm({ ...orderForm, duration_weeks: e.target.value })}
                style={{ flex: 1, padding: 10, borderRadius: 6, border: `0.5px solid ${BORDER}`, fontSize: 13, background: 'rgba(255,255,255,0.04)', color: TEXT, fontFamily: NAV_FONT }} />
            </div>
            <button onClick={addOrder} disabled={savingOrder || !orderForm.order_name.trim()}
              style={{ marginTop: 10, width: '100%', padding: 10, background: GREEN, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {savingOrder ? 'Saving...' : 'Add Order'}
            </button>
          </div>
        )}

        {programs.length === 0 ? <p style={{ color: TEXT_MUTED, margin: 0 }}>No court orders tracked yet.</p> : (
          programs.map(p => {
            const weeksIn = Math.floor((Date.now() - new Date(p.start_date)) / (7 * 86400000));
            const pct = p.duration_weeks ? Math.min(Math.round((weeksIn / p.duration_weeks) * 100), 100) : null;
            const isDone = p.status === 'completed';
            const isTerminated = p.status === 'terminated';
            const notesForProgram = progressNotes.filter(n => n.client_program_id === p.id);
            return (
              <div key={p.id} style={{ padding: '12px 0', borderBottom: `0.5px solid ${BORDER}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: TEXT, fontWeight: 600, fontSize: 14 }}>{p.order_name}</div>
                    <div style={{ color: TEXT_DIM, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{p.order_type === 'accompanying' ? 'Accompanying order' : 'Primary order'}</div>
                  </div>
                  {!isDone && !isTerminated && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => markComplete(p)} style={{ background: GREEN, color: 'white', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>🎉 Mark Complete</button>
                      <button onClick={() => markTerminated(p)} style={{ background: 'rgba(255,255,255,0.04)', color: RED, border: `0.5px solid ${BORDER}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>End</button>
                    </div>
                  )}
                  {isDone && <span style={{ background: 'rgba(76,175,125,0.15)', color: GREEN, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>🎉 Completed</span>}
                  {isTerminated && <span style={{ background: 'rgba(248,113,113,0.15)', color: RED, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Ended</span>}
                </div>
                {pct !== null && !isDone && !isTerminated && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4 }}>Week {Math.max(weeksIn, 0)} of {p.duration_weeks}</div>
                  </div>
                )}
                {(isDone || isTerminated) && p.completed_at && (
                  <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4 }}>{isDone ? 'Completed' : 'Ended'} {new Date(p.completed_at).toLocaleDateString()}</div>
                )}

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${BORDER}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_DIM, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Progress Notes</div>
                    <button onClick={() => { setNoteForm({ ...noteForm, client_program_id: p.id }); setShowAddNote(showAddNote === p.id ? null : p.id); }}
                      style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      {showAddNote === p.id ? 'Cancel' : '+ Note'}
                    </button>
                  </div>

                  {showAddNote === p.id && (
                    <div style={{ ...subCardStyle, padding: 12, marginTop: 8, marginBottom: 0 }}>
                      <input type="date" value={noteForm.note_date} onChange={e => setNoteForm({ ...noteForm, note_date: e.target.value })} style={{ ...inputStyle, padding: 9 }} />
                      <NotesWarning />
                      <textarea placeholder="e.g. Showed up on time, we talked about job search — doing well."
                        value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                        style={{ ...inputStyle, padding: 9, minHeight: 60, marginBottom: 0 }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: TEXT, margin: '8px 0' }}>
                        <input type="checkbox" checked={noteForm.visible_to_client} onChange={e => setNoteForm({ ...noteForm, visible_to_client: e.target.checked })} />
                        Share this note with the client
                      </label>
                      <button onClick={addProgressNote} disabled={savingNote || !noteForm.content.trim()}
                        style={{ width: '100%', padding: 9, background: GREEN, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {savingNote ? 'Saving...' : 'Add Note'}
                      </button>
                    </div>
                  )}

                  {notesForProgram.length === 0 ? (
                    <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '8px 0 0' }}>No notes for this order yet.</p>
                  ) : (
                    notesForProgram.map(n => (
                      <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderTop: `0.5px solid ${BORDER}` }}>
                        <div>
                          <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {new Date(n.note_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {!n.visible_to_client && <span style={{ background: 'rgba(255,255,255,0.08)', color: TEXT_MUTED, padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>🔒 Private</span>}
                          </div>
                          <div style={{ fontSize: 13, color: TEXT }}>{n.content}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <button onClick={() => deleteProgressNote(n.id)} style={{ background: 'none', border: 'none', color: RED, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}>Delete</button>
                          <FlagRestrictedButton tableName="client_progress_notes" recordId={n.id} clientId={clientId} onFlagged={fetchAll} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}

        {milestones.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `0.5px solid ${BORDER}` }}>
            <h4 style={{ margin: '0 0 10px', color: TEXT, fontSize: 13 }}>Achievements</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {milestones.map(m => (
                <div key={m.id} title={m.description} style={{ background: 'rgba(91,155,240,0.15)', border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: ACCENT }}>
                  🏅 {m.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(() => {
        const generalNotes = progressNotes.filter(n => !n.client_program_id);
        return (
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0, color: TEXT, fontSize: 15 }}>General Notes</h3>
              <button onClick={() => { setNoteForm({ ...noteForm, client_program_id: '' }); setShowAddNote(showAddNote === 'general' ? null : 'general'); }}
                style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                {showAddNote === 'general' ? 'Cancel' : '+ Add Note'}
              </button>
            </div>
            <p style={{ color: TEXT_MUTED, fontSize: 12, margin: '0 0 12px' }}>Not tied to a specific order. Visible to the client on their Journey screen — keep it plain-language and positive. Never put clinical/diagnostic content here; use Case &amp; Clinical Notes for that.</p>

            {showAddNote === 'general' && (
              <div style={subCardStyle}>
                <input type="date" value={noteForm.note_date} onChange={e => setNoteForm({ ...noteForm, note_date: e.target.value })} style={inputStyle} />
                <NotesWarning />
                <textarea placeholder="e.g. Showed up on time, we talked about job search — doing well."
                  value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                  style={{ ...inputStyle, minHeight: 70 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: TEXT, margin: '10px 0' }}>
                  <input type="checkbox" checked={noteForm.visible_to_client} onChange={e => setNoteForm({ ...noteForm, visible_to_client: e.target.checked })} />
                  Share this note with the client
                </label>
                <button onClick={addProgressNote} disabled={savingNote || !noteForm.content.trim()}
                  style={{ marginTop: 10, width: '100%', padding: 10, background: GREEN, color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {savingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            )}

            {generalNotes.length === 0 ? <p style={{ color: TEXT_MUTED, margin: 0 }}>No general notes yet.</p> : (
              generalNotes.map(n => (
                <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `0.5px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {new Date(n.note_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {!n.visible_to_client && <span style={{ background: 'rgba(255,255,255,0.08)', color: TEXT_MUTED, padding: '1px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>🔒 Private — not shared</span>}
                    </div>
                    <div style={{ fontSize: 14, color: TEXT }}>{n.content}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <button onClick={() => deleteProgressNote(n.id)} style={{ background: 'none', border: 'none', color: RED, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Delete</button>
                    <FlagRestrictedButton tableName="client_progress_notes" recordId={n.id} clientId={clientId} onFlagged={fetchAll} />
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })()}

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', color: TEXT, fontSize: 15 }}>Signed Forms</h3>
        {signatures.length === 0 ? <p style={{ color: TEXT_MUTED, margin: 0 }}>No forms signed yet.</p> : (
          signatures.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `0.5px solid ${BORDER}` }}>
              <div>
                <div style={{ fontSize: 14, color: TEXT }}>{s.form_title}</div>
                <div style={{ fontSize: 12, color: TEXT_DIM }}>Signed by {s.signature_name} on {new Date(s.signed_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', color: TEXT, fontSize: 15 }}>Check-In History (Last 7)</h3>
        {checkIns.length === 0 ? <p style={{ color: TEXT_MUTED, margin: 0 }}>No check-ins recorded.</p> : (
          checkIns.map(ci => {
            const durationMin = ci.checked_out_at ? Math.round((new Date(ci.checked_out_at) - new Date(ci.checked_in_at)) / 60000) : null
            return (
              <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `0.5px solid ${BORDER}`, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ color: TEXT }}>{new Date(ci.checked_in_at).toLocaleDateString()}</span>
                <span style={{ color: TEXT_MUTED, fontSize: 13 }}>{ci.latitude && ci.longitude ? '📍 GPS Verified' : 'No location'}</span>
                {durationMin !== null ? (
                  <span style={{ color: GREEN, fontWeight: 600, fontSize: 13 }}>✓ {Math.floor(durationMin / 60)}h {durationMin % 60}m</span>
                ) : (
                  <span style={{ color: WARNING, fontWeight: 600, fontSize: 13 }}>Checked in, no check-out</span>
                )}
              </div>
            )
          })
        )}
      </div>

      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 12px', color: TEXT, fontSize: 15 }}>Upcoming Court Dates</h3>
        {courtDates.length === 0 ? <p style={{ color: TEXT_MUTED, margin: 0 }}>No upcoming court dates.</p> : (
          courtDates.map(cd => (
            <div key={cd.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `0.5px solid ${BORDER}`, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: TEXT }}>{new Date(cd.hearing_date).toLocaleDateString()}</span>
              <span style={{ color: TEXT_MUTED, fontSize: 13 }}>{cd.court_name || 'Court'}</span>
              <span style={{ background: 'rgba(61,111,168,0.15)', color: WARNING, padding: '2px 8px', borderRadius: 8, fontSize: 12 }}>{cd.hearing_type || 'Hearing'}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', color: TEXT, fontSize: 15 }}>Recent Drug Tests</h3>
        {drugTests.length === 0 ? <p style={{ color: TEXT_MUTED, margin: 0 }}>No drug tests recorded.</p> : (
          drugTests.map(dt => (
            <div key={dt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `0.5px solid ${BORDER}`, flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: TEXT }}>{new Date(dt.test_date).toLocaleDateString()}</span>
              <span style={{ color: TEXT_MUTED, fontSize: 13 }}>{dt.substances_tested || dt.test_type || 'Panel'}</span>
              <span style={{ background: dt.result === 'negative' ? 'rgba(76,175,125,0.15)' : 'rgba(248,113,113,0.15)', color: dt.result === 'negative' ? GREEN : RED, padding: '2px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                {dt.result || 'Pending'}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate && onNavigate('messages', clientId)} style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>📩 Send Message</button>
        <button onClick={() => onNavigate && onNavigate('reports')} style={{ background: GREEN, color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>📄 View Reports</button>
      </div>
    </div>
  );
}
