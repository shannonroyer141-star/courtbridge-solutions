import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const POPULATION_CONFIG = {
  catch_court: {
    color: '#4A6FA5',
    label: 'CATCH Court',
    checkInLabel: 'I Am Safe',
    checkInSub: 'Confirm your safe location',
    safeWord: 'SUNRISE',
    affirmations: [
      'You are stronger than anything that has tried to break you.',
      'Your story is not over. The best chapters are still being written.',
      'You deserve safety, peace, and a life that is fully your own.',
      'Every day you show up is an act of courage.',
      'You are not defined by what happened to you.',
    ],
  },
  drug_court: {
    color: '#27AE60',
    label: 'Recovery Program',
    checkInLabel: 'Check In Now',
    checkInSub: 'GPS check-in for today',
    affirmations: [
      'One day at a time. Today is enough.',
      'Recovery is not a straight line — keep going anyway.',
      'The strength it took to get here will carry you forward.',
      'You are proof that change is possible.',
      'Every meeting attended is a brick in the foundation of your new life.',
    ],
  },
  bip: {
    color: '#7B3F8C',
    label: 'Accountability Program',
    checkInLabel: 'Check In Now',
    checkInSub: 'GPS check-in for today',
    affirmations: [
      'Accountability is not punishment — it is the path to who you want to be.',
      'Change takes courage. You are showing up.',
      'The person you are becoming is worth the work.',
      'Taking responsibility is the first step to freedom.',
      'Every session completed is evidence of your commitment.',
    ],
  },
  probation: {
    color: '#1B3A6B',
    label: 'Supervision Program',
    checkInLabel: 'Check In Now',
    checkInSub: 'GPS check-in for today',
    affirmations: [
      'You are building a record that speaks for itself.',
      'Consistency today creates opportunity tomorrow.',
      'Every requirement met is a step toward full freedom.',
      'You have more going for you than against you.',
      'Stay the course. It is worth it.',
    ],
  },
  mental_health: {
    color: '#E67E22',
    label: 'Wellness Program',
    checkInLabel: 'Check In Now',
    checkInSub: 'GPS check-in for today',
    affirmations: [
      'Healing is not linear — and that is okay.',
      'Asking for help is one of the bravest things a person can do.',
      'You are worthy of care, rest, and peace.',
      'Small steps forward still count as progress.',
      'Your mental health matters as much as anything else in your life.',
    ],
  },
  other: {
    color: '#16A085',
    label: 'Community Program',
    checkInLabel: 'Check In Now',
    checkInSub: 'GPS check-in for today',
    affirmations: [
      'You are part of something bigger than this moment.',
      'Every commitment you keep builds trust — with others and yourself.',
      'You showed up today. That matters.',
      'Progress is happening even when it feels slow.',
      'You are writing a new story.',
    ],
  },
  cps: {
    color: '#E05A2B',
    label: 'Family Services',
    checkInLabel: 'Check In Now',
    checkInSub: 'GPS check-in for today',
    affirmations: [
      'Your children are rooting for you.',
      'Every step you take today is a step toward your family.',
      'The love you have for your children is the strength that will carry you through.',
      'You are doing hard things for the most important reason.',
      'Every document submitted, every class attended — it all counts.',
    ],
  },
};

export default function ClientAppDashboard() {
  const [client, setClient] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [courtDates, setCourtDates] = useState([]);
  const [drugTests, setDrugTests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [checkInStatus, setCheckInStatus] = useState('idle');
  const [location, setLocation] = useState(null);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientData();
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
    const day = Math.floor(Date.now() / 86400000);
    setAffirmationIndex(day % 5);
  }, []);

  async function fetchClientData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('clients').select('*').eq('id', user.id).single();
    if (profile) setClient(profile);
    const { data: ci } = await supabase.from('checkins').select('*').eq('client_id', user.id).order('checked_in_at', { ascending: false }).limit(10);
    if (ci) setCheckIns(ci);
    const { data: cd } = await supabase.from('court_dates').select('*').eq('client_id', user.id).gte('hearing_date', new Date().toISOString().split('T')[0]).order('hearing_date').limit(3);
    if (cd) setCourtDates(cd);
    const { data: dt } = await supabase.from('drug_tests').select('*').eq('client_id', user.id).order('test_date', { ascending: false }).limit(3);
    if (dt) setDrugTests(dt);
    const { data: tk } = await supabase.from('tasks').select('*').eq('client_id', user.id).eq('completed', false).order('due_date').limit(5);
    if (tk) setTasks(tk);
    setLoading(false);
  }

  async function handleCheckIn() {
    setCheckInStatus('saving');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('checkins').insert([{
      client_id: user.id,
      checked_in_at: new Date().toISOString(),
      latitude: location.lat,
      longitude: location.lng,
    }]);
    if (error) { setCheckInStatus('error'); return; }
    setCheckInStatus('done');
    fetchClientData();
  }

  const pop = client?.population_type && POPULATION_CONFIG[client.population_type]
    ? POPULATION_CONFIG[client.population_type]
    : POPULATION_CONFIG.other;

  const isCatch = client?.population_type === 'catch_court';
  const firstName = client?.name?.split(' ')[0] || 'there';
  const affirmation = pop.affirmations[affirmationIndex % pop.affirmations.length];
  const checkedInToday = checkIns.some(c => new Date(c.checked_in_at).toDateString() === new Date().toDateString());
  const streak = checkIns.reduce((acc, ci, i, arr) => {
    if (i === 0) return 1;
    const diff = (new Date(arr[i-1].checked_in_at) - new Date(ci.checked_in_at)) / 86400000;
    return diff <= 1.5 ? acc + 1 : acc;
  }, checkIns.length > 0 ? 1 : 0);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F4F6F9' }}>
      <p style={{ color: '#8A9BB0' }}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={{ background: '#F4F6F9', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: pop.color, padding: '20px 20px 24px', color: 'white' }}>
        <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>CourtBridge Solutions</div>
        <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '12px' }}>{pop.label}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>Welcome back, {firstName}</div>
            <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '2px' }}>We are glad you are here today.</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{streak}</div>
            <div style={{ fontSize: '10px', opacity: 0.9 }}>{isCatch ? 'days strong' : 'day streak'}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Daily Affirmation */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px', marginBottom: '14px', borderLeft: '4px solid ' + pop.color }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: pop.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Today's Affirmation</div>
          <div style={{ fontSize: '15px', color: '#2C3E50', lineHeight: '1.5', fontStyle: 'italic' }}>{affirmation}</div>
        </div>

        {/* Check In Button */}
        {checkedInToday ? (
          <div style={{ background: '#eafaf1', border: '2px solid #27AE60', borderRadius: '14px', padding: '18px', marginBottom: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>✅</div>
            <div style={{ fontWeight: 'bold', color: '#1e8449', fontSize: '16px' }}>
              {isCatch ? 'You are safe — confirmed today' : 'Checked in today!'}
            </div>
            <div style={{ color: '#8A9BB0', fontSize: '13px', marginTop: '4px' }}>Great work. See you tomorrow.</div>
          </div>
        ) : (
          <div style={{ marginBottom: '14px' }}>
            <button
              onClick={handleCheckIn}
              disabled={checkInStatus === 'saving'}
              style={{ width: '100%', background: checkInStatus === 'saving' ? '#aaa' : pop.color, color: 'white', border: 'none', borderRadius: '14px', padding: '20px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {checkInStatus === 'saving' ? 'Saving...' : pop.checkInLabel}
            </button>
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#8A9BB0', marginTop: '6px' }}>{pop.checkInSub}</div>
            {checkInStatus === 'no_gps' && <div style={{ textAlign: 'center', fontSize: '12px', color: '#E74C3C', marginTop: '4px' }}>Please allow location access to check in.</div>}
            {checkInStatus === 'done' && <div style={{ textAlign: 'center', fontSize: '12px', color: '#27AE60', marginTop: '4px' }}>Check-in saved!</div>}
          </div>
        )}

        {/* Safe Word for CATCH Court */}
        {isCatch && (
          <div style={{ background: '#FEF9EC', border: '1px solid #F39C12', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#B7770D', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Safety Word</div>
            <div style={{ fontSize: '13px', color: '#2C3E50' }}>If you are not safe, type <strong>SUNRISE</strong> in the notes field of your next check-in. Your advocate will be notified privately.</div>
          </div>
        )}

        {/* Upcoming Court Dates */}
        {courtDates.length > 0 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '10px' }}>⚖️ Upcoming Court Dates</div>
            {courtDates.map(cd => (
              <div key={cd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#2C3E50' }}>{cd.hearing_type || 'Court Hearing'}</div>
                  <div style={{ fontSize: '12px', color: '#8A9BB0' }}>{cd.court_name}</div>
                </div>
                <div style={{ background: '#FEF9EC', color: '#B7770D', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  {new Date(cd.hearing_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Drug Tests */}
        {drugTests.length > 0 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '10px' }}>🧪 Recent Drug Tests</div>
            {drugTests.map(dt => (
              <div key={dt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#2C3E50' }}>{dt.test_type || 'Drug Test'}</div>
                  <div style={{ fontSize: '12px', color: '#8A9BB0' }}>{dt.test_date}</div>
                </div>
                <div style={{ background: dt.result === 'negative' ? '#eafaf1' : '#fdecea', color: dt.result === 'negative' ? '#1e8449' : '#c0392b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  {dt.result || 'Pending'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Open Tasks */}
        {tasks.length > 0 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '10px' }}>📋 Tasks To Complete</div>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.priority === 'High' ? '#E74C3C' : '#F39C12', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', color: '#2C3E50' }}>{t.title}</div>
                  {t.due_date && <div style={{ fontSize: '12px', color: '#8A9BB0' }}>Due {new Date(t.due_date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Check-In History */}
        {checkIns.length > 0 && (
          <div style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C3E50', marginBottom: '10px' }}>📅 Recent Check-Ins</div>
            {checkIns.slice(0, 5).map(ci => (
              <div key={ci.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '13px', color: '#2C3E50' }}>{new Date(ci.checked_in_at).toLocaleDateString()}</div>
                <div style={{ fontSize: '12px', color: '#1e8449', fontWeight: '500' }}>✓ {isCatch ? 'Safe' : 'Present'}</div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '24px', textAlign: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👋</div>
            <div style={{ fontWeight: 'bold', color: '#2C3E50', fontSize: '16px', marginBottom: '4px' }}>Welcome to CourtBridge</div>
            <div style={{ color: '#8A9BB0', fontSize: '14px' }}>Your program information will appear here once your provider has set everything up.</div>
          </div>
        )}

      </div>
    </div>
  );
}