import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteForm, setNoteForm] = useState({ note_date: new Date().toISOString().split('T')[0], content: '', visible_to_client: true });
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (clientId) fetchAll();
  }, [clientId]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: c }, { data: ci }, { data: cd }, { data: dt }, { data: cp }, { data: cm }, { data: pn }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('checkins').select('*').eq('client_id', clientId).order('checked_in_at', { ascending: false }).limit(7),
      supabase.from('court_dates').select('*').eq('client_id', clientId).order('hearing_date', { ascending: true }).limit(3),
      supabase.from('drug_tests').select('*').eq('client_id', clientId).order('test_date', { ascending: false }).limit(3),
      supabase.from('client_programs').select('*').eq('client_id', clientId).order('created_at'),
      supabase.from('client_milestones').select('*').eq('client_id', clientId).order('achieved_at', { ascending: false }),
      supabase.from('client_progress_notes').select('*').eq('client_id', clientId).order('note_date', { ascending: false }),
    ]);
    setClient(c);
    setCheckIns(ci || []);
    setCourtDates(cd || []);
    setDrugTests(dt || []);
    setPrograms(cp || []);
    setMilestones(cm || []);
    setProgressNotes(pn || []);
    setLoading(false);
  }

  async function addProgressNote() {
    if (!noteForm.content.trim()) return;
    setSavingNote(true);
    await supabase.from('client_progress_notes').insert({
      client_id: clientId,
      note_date: noteForm.note_date,
      content: noteForm.content.trim(),
      visible_to_client: noteForm.visible_to_client,
    });
    setNoteForm({ note_date: new Date().toISOString().split('T')[0], content: '', visible_to_client: true });
    setShowAddNote(false);
    setSavingNote(false);
    fetchAll();
  }

  async function deleteProgressNote(id) {
    await supabase.from('client_progress_notes').delete().eq('id', id);
    fetchAll();
  }

  async function addOrder() {
    if (!orderForm.order_name.trim()) return;
    setSavingOrder(true);
    await supabase.from('client_programs').insert({
      client_id: clientId,
      order_name: orderForm.order_name.trim(),
      order_type: orderForm.order_type,
      start_date: orderForm.start_date,
      duration_weeks: orderForm.duration_weeks ? parseInt(orderForm.duration_weeks, 10) : null,
    });
    setOrderForm({ order_name: '', order_type: 'primary', start_date: new Date().toISOString().split('T')[0], duration_weeks: '' });
    setShowAddOrder(false);
    setSavingOrder(false);
    fetchAll();
  }

  async function markComplete(program) {
    const completedAt = new Date().toISOString();
    await supabase.from('client_programs').update({ status: 'completed', completed_at: completedAt }).eq('id', program.id);

    await supabase.from('client_milestones').insert({
      client_id: clientId,
      milestone_type: `program_completed_${program.id}`,
      title: `Completed: ${program.order_name}`,
      description: `Successfully completed ${program.order_name}.`,
    });

    const { count: totalCheckins } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('checked_in_at', program.start_date);

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('completion_certificates').insert({
      client_id: clientId,
      provider_id: user.id,
      program_name: program.order_name,
      completion_date: completedAt.split('T')[0],
      total_checkins: totalCheckins || 0,
      certificate_number: `CB-${Date.now().toString().slice(-8)}`,
      issued_at: completedAt,
    });

    fetchAll();
  }

  async function markTerminated(program) {
    await supabase.from('client_programs').update({ status: 'terminated', completed_at: new Date().toISOString() }).eq('id', program.id);
    fetchAll();
  }

  function getStatusColor(status) {
    if (status === 'active') return '#16a34a';
    if (status === 'at_risk') return '#dc2626';
    return '#d97706';
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading client...</div>;
  if (!client) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
      No client selected.
      {onNavigate && <div style={{ marginTop: 12 }}><button onClick={() => onNavigate('clients')} style={{ background: 'none', border: 'none', color: '#1e3a5f', fontWeight: 600, cursor: 'pointer' }}>← Back to Clients</button></div>}
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      {onNavigate && (
        <button onClick={() => onNavigate('clients')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '14px' }}>← Back to Clients</button>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: 'bold' }}>
          {(client.name || client.email || '?')[0].toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#1e3a5f' }}>{client.name || client.email}</h2>
          <span style={{ background: getStatusColor(client.status), color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
            {client.status || 'Pending'}
          </span>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#1e3a5f', fontSize: '15px' }}>Journey — Court Orders & Programs</h3>
          <button onClick={() => setShowAddOrder(!showAddOrder)} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>+ Add Order</button>
        </div>

        {showAddOrder && (
          <div style={{ background: '#F9FAFB', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
            <input placeholder="Order name (e.g. 52-Week Drug Court Program)" value={orderForm.order_name}
              onChange={e => setOrderForm({ ...orderForm, order_name: e.target.value })}
              style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '13px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={orderForm.order_type} onChange={e => setOrderForm({ ...orderForm, order_type: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}>
                <option value="primary">Primary order</option>
                <option value="accompanying">Accompanying order</option>
              </select>
              <input type="date" value={orderForm.start_date} onChange={e => setOrderForm({ ...orderForm, start_date: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} />
              <input type="number" placeholder="Duration (weeks, optional)" value={orderForm.duration_weeks}
                onChange={e => setOrderForm({ ...orderForm, duration_weeks: e.target.value })}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} />
            </div>
            <button onClick={addOrder} disabled={savingOrder || !orderForm.order_name.trim()}
              style={{ marginTop: '10px', width: '100%', padding: '10px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              {savingOrder ? 'Saving...' : 'Add Order'}
            </button>
          </div>
        )}

        {programs.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No court orders tracked yet.</p> : (
          programs.map(p => {
            const weeksIn = Math.floor((Date.now() - new Date(p.start_date)) / (7 * 86400000));
            const pct = p.duration_weeks ? Math.min(Math.round((weeksIn / p.duration_weeks) * 100), 100) : null;
            const isDone = p.status === 'completed';
            const isTerminated = p.status === 'terminated';
            return (
              <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div>
                    <div style={{ color: '#1e3a5f', fontWeight: '600', fontSize: '14px' }}>{p.order_name}</div>
                    <div style={{ color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{p.order_type === 'accompanying' ? 'Accompanying order' : 'Primary order'}</div>
                  </div>
                  {!isDone && !isTerminated && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => markComplete(p)} style={{ background: '#27AE60', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>🎉 Mark Complete</button>
                      <button onClick={() => markTerminated(p)} style={{ background: 'white', color: '#dc2626', border: '1px solid #ddd', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>End</button>
                    </div>
                  )}
                  {isDone && <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>🎉 Completed</span>}
                  {isTerminated && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>Ended</span>}
                </div>
                {pct !== null && !isDone && !isTerminated && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ height: '6px', borderRadius: '3px', background: '#f0f4fa', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#2563EB', borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Week {Math.max(weeksIn, 0)} of {p.duration_weeks}</div>
                  </div>
                )}
                {(isDone || isTerminated) && p.completed_at && (
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{isDone ? 'Completed' : 'Ended'} {new Date(p.completed_at).toLocaleDateString()}</div>
                )}
              </div>
            );
          })
        )}

        {milestones.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6' }}>
            <h4 style={{ margin: '0 0 10px', color: '#1e3a5f', fontSize: '13px' }}>Achievements</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {milestones.map(m => (
                <div key={m.id} title={m.description} style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: '#1e3a5f' }}>
                  🏅 {m.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#1e3a5f', fontSize: '15px' }}>Progress Notes</h3>
          <button onClick={() => setShowAddNote(!showAddNote)} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>+ Add Note</button>
        </div>
        <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 12px' }}>Visible to the client on their Journey screen — keep it plain-language and positive. Never put clinical/diagnostic content here; use Case &amp; Clinical Notes for that.</p>

        {showAddNote && (
          <div style={{ background: '#F9FAFB', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
            <input type="date" value={noteForm.note_date} onChange={e => setNoteForm({ ...noteForm, note_date: e.target.value })}
              style={{ width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '13px' }} />
            <textarea placeholder="e.g. Showed up on time, we talked about job search — doing well."
              value={noteForm.content} onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '13px', minHeight: '70px' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', margin: '10px 0' }}>
              <input type="checkbox" checked={noteForm.visible_to_client} onChange={e => setNoteForm({ ...noteForm, visible_to_client: e.target.checked })} />
              Share this note with the client
            </label>
            <button onClick={addProgressNote} disabled={savingNote || !noteForm.content.trim()}
              style={{ marginTop: '10px', width: '100%', padding: '10px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              {savingNote ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        )}

        {progressNotes.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No progress notes yet.</p> : (
          progressNotes.map(n => (
            <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {new Date(n.note_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {!n.visible_to_client && <span style={{ background: '#F3F4F6', color: '#6b7280', padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600' }}>🔒 Private — not shared</span>}
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>{n.content}</div>
              </div>
              <button onClick={() => deleteProgressNote(n.id)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Delete</button>
            </div>
          ))
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#1e3a5f', fontSize: '15px' }}>Check-In History (Last 7)</h3>
        {checkIns.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No check-ins recorded.</p> : (
          checkIns.map(ci => (
            <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>{new Date(ci.checked_in_at).toLocaleDateString()}</span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>{ci.latitude && ci.longitude ? `${ci.latitude.toFixed(5)}, ${ci.longitude.toFixed(5)}` : 'No location'}</span>
              <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '13px' }}>✓ Checked In</span>
            </div>
          ))
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#1e3a5f', fontSize: '15px' }}>Upcoming Court Dates</h3>
        {courtDates.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No upcoming court dates.</p> : (
          courtDates.map(cd => (
            <div key={cd.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>{new Date(cd.hearing_date).toLocaleDateString()}</span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>{cd.court_name || 'Court'}</span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>{cd.hearing_type || 'Hearing'}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 12px', color: '#1e3a5f', fontSize: '15px' }}>Recent Drug Tests</h3>
        {drugTests.length === 0 ? <p style={{ color: '#9ca3af', margin: 0 }}>No drug tests recorded.</p> : (
          drugTests.map(dt => (
            <div key={dt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#374151' }}>{new Date(dt.test_date).toLocaleDateString()}</span>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>{dt.substances_tested || dt.test_type || 'Panel'}</span>
              <span style={{ background: dt.result === 'negative' ? '#dcfce7' : '#fee2e2', color: dt.result === 'negative' ? '#16a34a' : '#dc2626', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                {dt.result || 'Pending'}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate && onNavigate('messages', clientId)} style={{ background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>📩 Send Message</button>
        <button style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>🚨 Create Alert</button>
        <button style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>📄 View Reports</button>
      </div>
    </div>
  );
}