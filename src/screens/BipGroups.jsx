import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { GREEN, WARNING, TEXT_MUTED, TEXT_DIM } from '../theme';
import { Field, Row2, Col, ErrorBox } from './bipShared';
import {
  inputStyle, sectionCard, optStyle, btn, ghostBtn, rowStyle, pageStyle, fmtDate, today, BIP_SESSION_TYPE,
} from '../lib/bipUi';

// BIP groups and weekly attendance -- Florida Rule 65H-2.016(6), F.A.C.
// (6)(b) 1.5-hour sessions; (6)(c) absence policy with a maximum number of unexcused absences;
// (6)(d) virtual attendees on camera with audio; (6)(e) at most 23 people co-facilitated,
// 15 single-facilitated (enforced by the database); (6)(g) separate services by sex/gender.

const GENDER_LABELS = { men: "Men's group", women: "Women's group" };
const FORMAT_LABELS = { in_person: 'In person', virtual: 'Virtual', hybrid: 'In person and virtual' };

function blankGroup() {
  return { name: '', gender: 'men', facilitation: 'co', format: 'in_person', language: 'English', schedule: '' };
}

export default function BipGroups({ session }) {
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [members, setMembers] = useState([]);
  const [bipClients, setBipClients] = useState([]);
  const [groupForm, setGroupForm] = useState(null);
  const [addClientId, setAddClientId] = useState('');
  const [attendance, setAttendance] = useState(null); // { date, cameraConfirmed, statuses: { clientId: status } }
  const [maxUnexcused, setMaxUnexcused] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');

  const group = groups.find(g => g.id === groupId) || null;
  const activeMembers = members.filter(m => !m.left_on);
  const cap = group ? (group.facilitation === 'co' ? 23 : 15) : 0;

  useEffect(() => { init(); }, []);
  useEffect(() => {
    setAttendance(null); setError(null); setMsg('');
    if (groupId) fetchMembers(groupId); else setMembers([]);
  }, [groupId]);

  async function init() {
    const [{ data: gs }, { data: cs }, { data: me }] = await Promise.all([
      supabase.from('bip_groups').select('*').order('name'),
      supabase.from('clients').select('id, name').eq('population_type', 'bip').order('name'),
      supabase.from('profiles').select('bip_max_unexcused_absences').eq('id', session.user.id).single(),
    ]);
    setGroups(gs || []);
    setBipClients(cs || []);
    setMaxUnexcused(me?.bip_max_unexcused_absences ?? '');
  }

  async function fetchMembers(id) {
    const { data } = await supabase.from('bip_group_members').select('*, clients(name)').eq('group_id', id).order('joined_on');
    setMembers(data || []);
  }

  async function saveGroup() {
    if (!groupForm.name.trim()) { setError('Name the group.'); return; }
    setSaving(true); setError(null);
    const { data, error: err } = await supabase.from('bip_groups').insert([{ ...groupForm, name: groupForm.name.trim(), provider_id: session.user.id }]).select().single();
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setGroupForm(null);
    await init();
    setGroupId(data.id);
  }

  async function addMember() {
    if (!addClientId) return;
    setError(null);
    const { error: err } = await supabase.from('bip_group_members').insert([{ group_id: groupId, client_id: addClientId, joined_on: today() }]);
    if (err) {
      setError(err.message.includes('bip_group_members_one_active')
        ? 'This participant is already active in a group. Remove them from that group first.'
        : err.message);
      return;
    }
    setAddClientId('');
    fetchMembers(groupId);
  }

  async function removeMember(m) {
    if (!window.confirm(`Remove ${m.clients?.name} from this group? Their attendance history stays in their file.`)) return;
    const { error: err } = await supabase.from('bip_group_members').update({ left_on: today() }).eq('id', m.id);
    if (err) { setError(err.message); return; }
    fetchMembers(groupId);
  }

  async function saveMaxUnexcused() {
    setError(null); setMsg('');
    const v = maxUnexcused === '' ? null : parseInt(maxUnexcused, 10);
    const { error: err } = await supabase.from('profiles').update({ bip_max_unexcused_absences: v }).eq('id', session.user.id);
    if (err) { setError('Could not save: ' + err.message); return; }
    setMsg('Absence policy saved.');
  }

  function startAttendance() {
    setAttendance({ date: today(), cameraConfirmed: false, statuses: Object.fromEntries(activeMembers.map(m => [m.client_id, 'attended'])) });
    setError(null); setMsg('');
  }

  async function saveAttendance() {
    const a = attendance;
    if (group.format !== 'in_person' && !a.cameraConfirmed) { setError('Confirm that virtual attendees were on camera with audio (Rule 65H-2.016(6)(d)).'); return; }
    setSaving(true); setError(null);
    const rows = activeMembers.map(m => ({
      client_id: m.client_id,
      provider_id: session.user.id,
      entered_by: session.user.id,
      service_type: BIP_SESSION_TYPE,
      service_date: a.date,
      units: 1.5,
      attendance_status: a.statuses[m.client_id],
      // A missed session isn't automatically noncompliance; the provider decides (existing design).
      compliance_status: a.statuses[m.client_id] === 'missed' ? 'pending_review' : 'compliant',
      event_notes: `${group.name}${group.format !== 'in_person' ? ' (virtual attendees confirmed on camera with audio)' : ''}`,
    }));
    const { error: err } = await supabase.from('service_records').insert(rows);
    setSaving(false);
    if (err) { setError('Could not save attendance: ' + err.message); return; }
    setAttendance(null);
    setMsg(`Attendance saved for ${rows.length} participant${rows.length === 1 ? '' : 's'}.`);
  }

  const available = bipClients.filter(c => !activeMembers.some(m => m.client_id === c.id));

  return (
    <div style={pageStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>BIP Groups</h2>
      <div style={{ color: TEXT_MUTED, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
        Groups are separated by sex or gender, capped at <strong>15</strong> people with one facilitator or <strong>23</strong> with two, and meet weekly for 1.5 hours (Rule 65H-2.016(6)). Attendance recorded here counts toward each participant's 24 sessions.
      </div>
      <ErrorBox error={error} />
      {msg && <div style={{ ...sectionCard, color: GREEN, padding: 14 }}>{msg}</div>}

      <div style={sectionCard}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Absence policy</div>
        <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 10 }}>Rule 65H-2.016(6)(c): your policy must set the maximum number of unexcused absences before a participant is terminated. It should match your written policy.</div>
        <Row2>
          <Col min={200}><Field label="Maximum unexcused absences"><input type="number" min="0" style={inputStyle} value={maxUnexcused} onChange={e => setMaxUnexcused(e.target.value)} /></Field></Col>
          <Col min={120}><div style={{ paddingTop: 22 }}><button style={ghostBtn} onClick={saveMaxUnexcused}>Save</button></div></Col>
        </Row2>
      </div>

      <div style={sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>Groups</div>
          {!groupForm && <button style={ghostBtn} onClick={() => { setGroupForm(blankGroup()); setError(null); }}>New group</button>}
        </div>
        {groups.length === 0 && !groupForm && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No groups yet.</div>}
        {groups.map(g => (
          <div key={g.id} style={{ ...rowStyle, cursor: 'pointer', fontWeight: g.id === groupId ? 700 : 400 }} onClick={() => setGroupId(g.id)}>
            <span>{g.name} <span style={{ color: TEXT_DIM, fontWeight: 400 }}>· {GENDER_LABELS[g.gender]} · {g.facilitation === 'co' ? 'Co-facilitated' : 'Single facilitator'} · {FORMAT_LABELS[g.format]}{g.language !== 'English' && ` · ${g.language}`}</span></span>
            <span style={{ color: TEXT_DIM }}>{g.schedule}</span>
          </div>
        ))}
        {groupForm && (
          <div style={{ marginTop: 12 }}>
            <Row2>
              <Col grow={2}><Field label="Group name *"><input style={inputStyle} value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} /></Field></Col>
              <Col><Field label="Schedule"><input style={inputStyle} value={groupForm.schedule} placeholder="e.g. Tuesdays 6:00-7:30pm" onChange={e => setGroupForm({ ...groupForm, schedule: e.target.value })} /></Field></Col>
            </Row2>
            <Row2>
              <Col min={150}><Field label="Group for"><select style={inputStyle} value={groupForm.gender} onChange={e => setGroupForm({ ...groupForm, gender: e.target.value })}>
                {Object.entries(GENDER_LABELS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}</select></Field></Col>
              <Col min={150}><Field label="Facilitators"><select style={inputStyle} value={groupForm.facilitation} onChange={e => setGroupForm({ ...groupForm, facilitation: e.target.value })}>
                <option value="co" style={optStyle}>Two (max 23 people)</option><option value="single" style={optStyle}>One (max 15 people)</option></select></Field></Col>
              <Col min={150}><Field label="Format"><select style={inputStyle} value={groupForm.format} onChange={e => setGroupForm({ ...groupForm, format: e.target.value })}>
                {Object.entries(FORMAT_LABELS).map(([k, l]) => <option key={k} value={k} style={optStyle}>{l}</option>)}</select></Field></Col>
              <Col min={150}><Field label="Language"><input style={inputStyle} value={groupForm.language} onChange={e => setGroupForm({ ...groupForm, language: e.target.value })} /></Field></Col>
            </Row2>
            {groupForm.language.trim().toLowerCase() !== 'english' && <div style={{ fontSize: 12.5, color: WARNING, marginBottom: 10 }}>A non-English group needs a facilitator fluent in that language (65H-2.016(6)(i)).</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={btn()} disabled={saving} onClick={saveGroup}>{saving ? 'Saving...' : 'Create group'}</button>
              <button style={ghostBtn} onClick={() => setGroupForm(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {group && (
        <div style={sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700 }}>{group.name} <span style={{ color: activeMembers.length >= cap ? WARNING : TEXT_MUTED, fontWeight: 400 }}>· {activeMembers.length} / {cap} people</span></div>
            {!attendance && activeMembers.length > 0 && <button style={btn()} onClick={startAttendance}>Record this week's attendance</button>}
          </div>
          {group.format !== 'in_person' && <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 10 }}>Virtual attendees must be on camera with audio (65H-2.016(6)(d)).</div>}

          {attendance ? (
            <div>
              <Field label="Session date"><input type="date" style={{ ...inputStyle, maxWidth: 220 }} value={attendance.date} onChange={e => setAttendance({ ...attendance, date: e.target.value })} /></Field>
              {activeMembers.map(m => (
                <div key={m.id} style={rowStyle}>
                  <span>{m.clients?.name}</span>
                  <select style={{ ...inputStyle, width: 'auto', marginBottom: 0, padding: '6px 10px' }} value={attendance.statuses[m.client_id]}
                    onChange={e => setAttendance({ ...attendance, statuses: { ...attendance.statuses, [m.client_id]: e.target.value } })}>
                    <option value="attended" style={optStyle}>Attended</option>
                    <option value="excused" style={optStyle}>Excused absence</option>
                    <option value="missed" style={optStyle}>Unexcused absence</option>
                  </select>
                </div>
              ))}
              {group.format !== 'in_person' && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, margin: '12px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={attendance.cameraConfirmed} onChange={e => setAttendance({ ...attendance, cameraConfirmed: e.target.checked })} />
                  All virtual attendees were on camera with audio
                </label>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button style={btn()} disabled={saving} onClick={saveAttendance}>{saving ? 'Saving...' : 'Save attendance (1.5 hours)'}</button>
                <button style={ghostBtn} onClick={() => setAttendance(null)}>Cancel</button>
              </div>
            </div>
          ) : <>
            {activeMembers.length === 0 && <div style={{ color: TEXT_MUTED, fontSize: 13 }}>No one in this group yet.</div>}
            {activeMembers.map(m => (
              <div key={m.id} style={rowStyle}>
                <span>{m.clients?.name} <span style={{ color: TEXT_DIM }}>· since {fmtDate(m.joined_on)}</span></span>
                <button style={ghostBtn} onClick={() => removeMember(m)}>Remove</button>
              </div>
            ))}
            {activeMembers.length < cap && (
              <Row2>
                <Col grow={3}><div style={{ marginTop: 14 }}><select style={inputStyle} value={addClientId} onChange={e => setAddClientId(e.target.value)}>
                  <option value="" style={optStyle}>Add a BIP participant</option>
                  {available.map(c => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
                </select></div></Col>
                <Col min={100}><div style={{ marginTop: 14 }}><button style={ghostBtn} disabled={!addClientId} onClick={addMember}>Add</button></div></Col>
              </Row2>
            )}
            {activeMembers.length >= cap && <div style={{ fontSize: 13, color: WARNING, marginTop: 10 }}>This group is at the maximum size allowed by Rule 65H-2.016(6)(e).</div>}
          </>}
        </div>
      )}
    </div>
  );
}
