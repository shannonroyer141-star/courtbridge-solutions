import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TEXT_MUTED, TEXT_DIM, BORDER, ACCENT, GREEN } from '../theme';
import { Field, ErrorBox } from './bipShared';
import { inputStyle, sectionCard, optStyle, btn, pageStyle, today } from '../lib/bipUi';

// Digital version of Peace Beyond Sights BIP's pre-enrollment Screening/Assessment
// Tool. Answers are compiled into one Clinical Note per assessment (clinical_notes
// table) -- the same restricted, client-invisible space used for every other
// sensitive clinical record in the app. Nothing here becomes its own searchable
// column; it's one protected note, same as any other clinical note.

const YESNO = { type: 'yesno' };
const TEXTF = { type: 'text' };
const AREA = { type: 'area' };
function CHECK(options) { return { type: 'check', options }; }

const SECTIONS = [
  {
    title: 'Presenting and Related Incidents',
    fields: [
      { key: 'incident_desc', label: 'Describe the incident for which you were referred to this program', ...AREA },
      { key: 'arrested', label: 'Were you arrested?', ...YESNO },
      { key: 'relationship_length', label: 'How long have you been in this relationship? / Explore', ...TEXTF },
      { key: 'first_violent_incident', label: 'Describe the first time an incident in this relationship involved violent behaviors', ...AREA },
      { key: 'worst_incident', label: 'Describe the worst incident in this relationship', ...AREA },
      { key: 'partner_medical', label: 'Did your partner need a doctor/hospital from this or any other incident? If yes, explain.', ...AREA },
      { key: 'violence_other_relationships', label: 'Have there been incidents of violence in any other relationships? Explore', ...AREA },
      { key: 'injunction_against', label: 'Has anyone ever taken an Injunction for Protection/Restraining Order against you? If yes, explain.', ...AREA },
      { key: 'violated_order', label: 'Were you ever accused of violating this order?', ...YESNO },
      { key: 'violent_family', label: 'Have you ever fought/become violent with another family member? If yes, explain.', ...AREA },
      { key: 'violent_stranger', label: 'Have you ever fought/become violent with a stranger or acquaintance? If yes, explain.', ...AREA },
    ],
  },
  {
    title: 'Criminal History',
    fields: [
      { key: 'prior_arrests', label: 'Aside from this incident, prior arrests (date, charge, outcome)', ...AREA },
      { key: 'criminal_comments', label: 'Comments (past probations, violations, immediate criminal family history)', ...AREA },
    ],
  },
  {
    title: 'Brief Psychosocial History — Childhood',
    fields: [
      { key: 'born_where', label: "Where were you born? / Describe your parents' relationship", ...TEXTF },
      { key: 'lived_with_growing_up', label: 'With whom did you live while growing up? Explore out-of-home placements, etc.', ...AREA },
      { key: 'family_of_origin', label: 'Family of origin history', ...AREA },
      { key: 'rules_discipline', label: 'Who made the rules and enforced discipline? Were rules clear/fair? How often punished?', ...AREA },
      { key: 'spanked_or_hit', label: 'Were you ever spanked or hit as a child? If yes, explore.', ...AREA },
      { key: 'abused_as_child', label: 'Do you feel you were abused as a child?', ...YESNO },
      { key: 'abuse_type', label: 'If so, type of abuse', ...CHECK(['Physical', 'Sexual', 'Emotional/Verbal']) },
      { key: 'abuse_by_whom', label: 'By whom? Frequency of abuse? Did you tell anyone? How did/does this affect you?', ...AREA },
      { key: 'law_enforcement_family', label: 'Was law enforcement or social services ever involved with your family?', ...YESNO },
      { key: 'witnessed_parent_violence', label: 'Did you witness violence between your parents/step-parents/guardians? Comments', ...AREA },
      { key: 'school_experience', label: 'Describe your school experiences. Suspended/expelled? Last grade completed?', ...AREA },
    ],
  },
  {
    title: 'Significant Relationships and Parenthood',
    fields: [
      { key: 'friends_now', label: 'Do you have many friends now? Close friends you trust with secrets?', ...AREA },
      { key: 'married_history', label: 'Ever been married? How many times? Describe marriage(s)/relationship — explore multiple separations/divorces.', ...AREA },
      { key: 'children', label: 'Do you have children? How many, ages/sexes, where do they live, visitation?', ...AREA },
      { key: 'partners_children', label: "Does your partner have children from a prior relationship? Ages/sexes/where they live.", ...AREA },
      { key: 'children_witness_violence', label: 'How has the violence affected your children / partner’s children? Where were they during incidents?', ...AREA },
      { key: 'dcf_report', label: 'Have you ever been reported to DCF for child abuse/neglect? If so, explain.', ...AREA },
    ],
  },
  {
    title: 'Risk Assessment',
    note: 'An approved standardized test may be substituted for this section.',
    fields: [
      { key: 'emotional_abuse', label: 'Emotional abuse', ...CHECK(['Name calling', 'Put downs', 'Humiliation']) },
      { key: 'intimidation', label: 'Intimidation', ...CHECK(['Throwing/breaking things', 'Punching walls/doors', 'Screaming and yelling', "Blocking partner's path", 'Pounding fists', 'Hurt pets', 'Pulling phone from wall']) },
      { key: 'threats', label: 'Threats', ...CHECK(['To harm/kill partner', 'To harm/kill their family', 'To harm/kill their friends', 'To harm/kill their children', 'To use a weapon', 'To destroy property', 'To take the children away', 'To kill self', 'To report to DCF/IRS/INS or other authority']) },
      { key: 'physical_abuse', label: 'Physical abuse', ...CHECK(['Pushed', 'Slapped', 'Punched', 'Strangled', 'Restrained', 'Kicked', 'Pulled hair', 'Bite', 'Extreme humiliation', 'Hit with object', 'Other']) },
      { key: 'attempted_kill_partner', label: 'Have you ever attempted to kill your partner?', ...YESNO },
      { key: 'fantasized_kill_partner', label: 'Have you ever fantasized about killing your partner?', ...YESNO },
      { key: 'risk_comments', label: 'Comments', ...AREA },
    ],
  },
  {
    title: 'Isolation / Stalking Behavior',
    fields: [
      { key: 'partner_car_access', label: 'Does your partner have access to a car?', ...YESNO },
      { key: 'isolation_areas', label: 'Areas of isolation — who has access to the phone, how many keys to the house, etc.', ...AREA },
      { key: 'jealousy', label: 'How do you express jealousy?', ...AREA },
      { key: 'monitor_partner', label: "Have you felt the need to monitor who your partner goes out with, where, what they do, or follow them?", ...YESNO },
      { key: 'monitored_comms', label: "Listened to her calls, opened her mail, read her e-mail? Explore recording, destroying mail, monitoring e-mail/internet.", ...AREA },
    ],
  },
  {
    title: 'Sexual Violence',
    fields: [
      { key: 'sexual_violence', label: 'Sexual violence', ...CHECK(['Pressured partner to have sex', 'Forced sex / pornography on partner', 'Attacked breasts or genitals', 'Violent sex', 'Used drugs/alcohol/pornography to coerce sex', 'Unfaithful']) },
    ],
  },
  {
    title: 'General',
    fields: [
      { key: 'argue_frequency', label: 'How often do you and your partner argue? Are fights happening more often / becoming more serious?', ...AREA },
      { key: 'weapons_access', label: 'Do you own or have access to any weapons? What type? Where kept?', ...AREA },
      { key: 'threatened_weapon', label: 'Have you ever threatened your partner with a weapon?', ...YESNO },
      { key: 'cleaned_weapon_argument', label: 'Have you ever cleaned a weapon while engaged in a disagreement?', ...YESNO },
      { key: 'martial_military_training', label: 'Do you have any martial arts, military, or law enforcement training? Explore.', ...AREA },
    ],
  },
  {
    title: 'Financial Abuse / Living Situation / Employment',
    fields: [
      { key: 'partner_employed', label: "Is your spouse/partner currently employed or attending school? Feelings about their outside activities?", ...AREA },
      { key: 'finances_control', label: 'Who handles finances / joint account / bills? How does partner get money if not working? Argue over money?', ...AREA },
      { key: 'living_arrangement', label: 'Current living arrangement — where and with whom?', ...AREA },
      { key: 'household_responsibilities', label: 'Household responsibilities — cleaning, cooking, repairs, laundry, childcare?', ...AREA },
      { key: 'employment_history', label: 'Currently employed? How long? Other employment/military/discharge history. If not employed: last worked, prior jobs, longest job, income sources.', ...AREA },
    ],
  },
  {
    title: 'Medical History',
    fields: [
      { key: 'health_problems', label: 'Health problems? Taking medication?', ...YESNO },
      { key: 'head_injury', label: 'Ever had a head injury, been knocked out, or in a coma? How long? (>24h may indicate TBI)', ...AREA },
      { key: 'doctors_care', label: "Currently under a doctor's care? Who, and for how long?", ...AREA },
    ],
  },
  {
    title: 'Psychiatric History / Mental Status',
    fields: [
      { key: 'prior_counseling', label: 'Have you ever been in counseling before? Comments.', ...AREA },
      { key: 'mental_disorder_diagnosis', label: 'Ever diagnosed with a mental disorder or hospitalized/crisis stabilization? If yes, explain.', ...AREA },
      { key: 'depression', label: 'Are you now or have you been depressed? Explore.', ...AREA },
      { key: 'psych_medication', label: 'Prescribed medication for depression, anxiety, sleep disorder, etc? If yes, explain.', ...AREA },
      { key: 'si_hi_ideation', label: 'Explore suicidal/homicidal ideations.', ...AREA },
      { key: 'family_mental_illness', label: 'Do any immediate family members have a history of mental illness?', ...YESNO },
    ],
  },
  {
    title: 'Mental Status Observations',
    note: 'Check all that apply, per category.',
    fields: [
      { key: 'ms_dress', label: 'Manner of Dress', ...CHECK(['Appropriate', 'Casual', 'Disheveled', 'Meticulously Neat', 'Eccentric', 'Seductive', 'Other']) },
      { key: 'ms_hygiene', label: 'Hygiene', ...CHECK(['Good', 'Fair', 'Poor', 'Neglected']) },
      { key: 'ms_speech', label: 'Speech Quality', ...CHECK(['Normal', 'Monotonous', 'Slow', 'Emotional', 'Rapid', 'Slurred', 'Pressured', 'Other']) },
      { key: 'ms_motor', label: 'Motor Behavior', ...CHECK(['Normal', 'Restlessness', 'Physical Agitation', 'Presence of tics', 'Unusual/Inappropriate', 'Slow']) },
      { key: 'ms_mood', label: 'Mood', ...CHECK(['Normal', 'Euthymic', 'Depressed', 'Pessimistic', 'Elated', 'Expansive', 'Calm', 'Neutral', 'Irritable', 'Cheerful', 'Anger', 'Mood Swings', 'Anxious', 'Fearful', 'Other']) },
      { key: 'ms_affect', label: 'Affect', ...CHECK(['Appropriate', 'Shallow', 'Inappropriate', 'Blunted', 'Depressive', 'Restricted', 'Angry', 'Anxious', 'Labile', 'Guilty', 'Flat', 'Other']) },
      { key: 'ms_thought_content', label: 'Thought Content', ...CHECK(['Appropriate', 'Preoccupations', 'Delusions', 'Obsessions', 'Grandiose', 'Antisocial']) },
      { key: 'ms_thought_process', label: 'Thought Processes', ...CHECK(['Logical', 'Coherent', 'Evasive', 'Circumstantial', 'Blocking', 'Distracted', 'Tangential', 'Loose Association', 'Bizarre', 'Incoherent', 'Confused', 'Other']) },
      { key: 'ms_judgment', label: 'Judgment', ...CHECK(['Good', 'Fair', 'Poor', 'Impaired']) },
      { key: 'ms_insight', label: 'Insight', ...CHECK(['Good', 'Fair', 'Poor', 'Limited']) },
      { key: 'ms_eye_contact', label: 'Eye Contact', ...CHECK(['Focused', 'Poor eye contact']) },
      { key: 'ms_orientation', label: 'Orientation', ...CHECK(['All spheres', 'Person only', 'Place only', 'Time only']) },
      { key: 'ms_suicide_risk', label: 'Suicide Risk', ...CHECK(['Severe', 'Moderate', 'Mild', 'None noted']) },
      { key: 'ms_homicide_risk', label: 'Homicidal Risk', ...CHECK(['Severe', 'Moderate', 'Mild', 'None noted']) },
      { key: 'ms_comments', label: 'Comments', ...AREA },
    ],
  },
  {
    title: 'Substance Abuse',
    note: 'Check all that apply.',
    fields: [
      { key: 'sa_pattern', label: 'Use/Drinking Pattern', ...CHECK(['Never', 'Uses/Drinks alone', 'Daily', '3-5 Times Weekly', '1-2 Times Weekly', 'Binges', 'Other']) },
      { key: 'sa_symptoms', label: 'Reported Symptoms', ...CHECK(['None', 'Chills', 'Blackouts', 'Sleep Problems', 'Tremors', 'Nausea', 'Hallucinations', 'Weight Loss', 'Seizures', 'Depression', 'D.T.s', 'Hangovers', 'Other']) },
      { key: 'sa_arrests', label: 'Substance Related Arrests', ...CHECK(['None', 'DUI', 'Disorderly Conduct', 'Fighting', 'Illegal Possession', 'Sale/Distribution']) },
      { key: 'sa_treatment', label: 'Previous Treatment', ...CHECK(['None', 'Detoxification', 'Residential', 'Intensive Outpatient', 'Half-way House', 'Outpatient']) },
      { key: 'sa_medical', label: 'Related Medical Problems', ...CHECK(['None', 'Pancreatitis', 'Hepatitis', 'Esophagitis', 'Cirrhosis', 'Other']) },
      { key: 'sa_use_history', label: 'Substance use history — which substances, age of first use, frequency, amount, date of last use', ...AREA },
      { key: 'sa_family', label: 'Do any immediate family members have an alcohol/substance abuse problem? Relationship / alcohol / drugs.', ...AREA },
      { key: 'sa_comments', label: 'Comments', ...AREA },
    ],
  },
  {
    title: 'Assessment Summary',
    fields: [
      { key: 'risk_checklist', label: 'Risk factors present (self-reported, reported by others, or confirmed)', ...CHECK(['History of violence with partner', 'Violence in other relationships', 'Criminal history', 'Has abused children', 'Childhood abuse reported', 'Witnessed violence as a child', 'Physical which required medical care', 'Attempts/fantasies to kill partner', 'Stalking/isolation', 'Sexual abuse', 'Availability of weapons', 'Financial abuse', 'Alcohol dependency/abuse', 'Substance dependency/abuse', 'Prior BIP enrollment']) },
      { key: 'accelerated_contact', label: 'Accelerated Partner Contact Recommended?', ...YESNO },
      { key: 'weapons_in_home', label: 'Weapons in the Home?', ...YESNO },
      { key: 'risk_impression', label: 'Risk Assessment / Impression', ...AREA },
      { key: 'appropriate_for_group', label: 'Appropriate for Class/Group Participation?', ...YESNO },
      { key: 'not_appropriate_why', label: 'If no, why not / alternate recommendation', ...AREA },
      { key: 'other_services', label: 'Other services recommended', ...CHECK(['Chemical Dependency', 'Mental Health', 'Other']) },
      { key: 'additional_comments', label: 'Additional Comments', ...AREA },
    ],
  },
];

function blankAnswers() {
  const a = {};
  for (const s of SECTIONS) for (const f of s.fields) a[f.key] = f.type === 'check' ? [] : '';
  return a;
}

function compileNote(clientName, answers) {
  const lines = [`BIP Assessment — ${clientName} — ${today()}`, ''];
  for (const s of SECTIONS) {
    lines.push(`## ${s.title}`);
    for (const f of s.fields) {
      const v = answers[f.key];
      const display = Array.isArray(v) ? v.join(', ') : v;
      if (display) lines.push(`${f.label}: ${display}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export default function BipAssessment({ session }) {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [answers, setAnswers] = useState(blankAnswers());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    supabase.from('clients').select('id, name').eq('population_type', 'bip').order('name')
      .then(({ data }) => setClients(data || []));
  }, []);

  function set(key, value) { setAnswers(prev => ({ ...prev, [key]: value })); }
  function toggleCheck(key, option) {
    setAnswers(prev => {
      const current = prev[key] || [];
      const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
      return { ...prev, [key]: next };
    });
  }

  async function handleSave() {
    if (!clientId) { setError('Select a participant first.'); return; }
    setSaving(true); setError(null); setSavedMsg('');
    const client = clients.find(c => c.id === clientId);
    const content = compileNote(client?.name || 'Participant', answers);
    const { error: err } = await supabase.from('clinical_notes').insert([{
      client_id: clientId,
      provider_id: session.user.id,
      title: `BIP Assessment — ${today()}`,
      content,
      entry_date: today(),
    }]);
    setSaving(false);
    if (err) { setError('Could not save: ' + err.message); return; }
    setSavedMsg('Assessment saved to this participant’s Clinical Notes.');
    setAnswers(blankAnswers());
  }

  const yesNoBtn = (val, key) => (opt) => (
    <button
      key={opt}
      onClick={() => set(key, val === opt ? '' : opt)}
      style={{
        padding: '7px 16px', borderRadius: 6, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
        border: val === opt ? `1px solid ${ACCENT}` : `0.5px solid ${BORDER}`,
        background: val === opt ? 'rgba(91,155,240,0.15)' : 'transparent',
        color: val === opt ? ACCENT : TEXT_MUTED, fontWeight: val === opt ? 700 : 400,
      }}
    >{opt}</button>
  );

  function renderField(f) {
    const v = answers[f.key];
    if (f.type === 'yesno') {
      return (
        <Field label={f.label}>
          <div style={{ display: 'flex', gap: 8 }}>{['Yes', 'No'].map(yesNoBtn(v, f.key))}</div>
        </Field>
      );
    }
    if (f.type === 'check') {
      return (
        <Field label={f.label}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {f.options.map(opt => (
              <button
                key={opt}
                onClick={() => toggleCheck(f.key, opt)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  border: (v || []).includes(opt) ? `1px solid ${ACCENT}` : `0.5px solid ${BORDER}`,
                  background: (v || []).includes(opt) ? 'rgba(91,155,240,0.15)' : 'transparent',
                  color: (v || []).includes(opt) ? ACCENT : TEXT_MUTED, fontWeight: (v || []).includes(opt) ? 700 : 400,
                }}
              >{opt}</button>
            ))}
          </div>
        </Field>
      );
    }
    if (f.type === 'area') {
      return (
        <Field label={f.label}>
          <textarea value={v} onChange={e => set(f.key, e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
        </Field>
      );
    }
    return (
      <Field label={f.label}>
        <input value={v} onChange={e => set(f.key, e.target.value)} style={inputStyle} />
      </Field>
    );
  }

  return (
    <div style={pageStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 6 }}>Batterers Intervention Program Assessment Form</h2>
      <div style={{ color: TEXT_MUTED, fontSize: 13.5, marginBottom: 20, lineHeight: 1.6 }}>
        Pre-enrollment screening/assessment interview. Answers save as one Clinical Note on the participant's
        file — private to your organization's staff, never visible to the participant, same as every other
        clinical record on the platform.
      </div>
      <ErrorBox error={error} />
      {savedMsg && <div style={{ ...sectionCard, color: GREEN, padding: 14 }}>{savedMsg}</div>}

      <div style={sectionCard}>
        <Field label="Participant *">
          <select style={inputStyle} value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="" style={optStyle}>Select participant...</option>
            {clients.map(c => <option key={c.id} value={c.id} style={optStyle}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      {SECTIONS.map(section => (
        <div key={section.title} style={sectionCard}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: section.note ? 2 : 14 }}>{section.title}</div>
          {section.note && <div style={{ fontSize: 12, color: TEXT_DIM, fontStyle: 'italic', marginBottom: 14 }}>{section.note}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {section.fields.map(f => <div key={f.key}>{renderField(f)}</div>)}
          </div>
        </div>
      ))}

      <button style={btn()} disabled={saving || !clientId} onClick={handleSave}>
        {saving ? 'Saving...' : 'Save Assessment'}
      </button>
    </div>
  );
}
