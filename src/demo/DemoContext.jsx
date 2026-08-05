// src/demo/DemoContext.jsx
import { createContext, useContext, useState } from 'react';
import { DEMO_CLIENT, SEEDED_CHECKINS, DEMO_COMPLIANCE_SUMMARY } from './mockData';

const DemoContext = createContext(null);

export function DemoProvider({ children }) {
  const [phase, setPhase] = useState('provider-signup');
  const [providerInfo, setProviderInfo] = useState({ name: '', email: '' });
  const [clientInfo, setClientInfo] = useState({ ...DEMO_CLIENT });
  const [checkins, setCheckins] = useState([]);
  const [branding, setBrandingState] = useState({ accentColor: '#1B3A6B', agencyName: '' });
  const [lang, setLang] = useState('en');

  function signUpProvider(name, email) {
    setProviderInfo({ name, email });
    setBrandingState(prev => ({ ...prev, agencyName: name }));
    setPhase('customize-branding');
  }

  function setBranding(accentColor, agencyName) {
    setBrandingState({ accentColor, agencyName });
    setPhase('provider-dashboard');
  }

  function sendClientLink() {
    setPhase('client-link-sent');
  }

  function switchToClient() {
    setPhase('client-onboarding');
  }

  function completeOnboarding() {
    setClientInfo(prev => ({
      ...prev,
      enrollment_date: new Date().toISOString(),
      status: 'active',
    }));
    setCheckins(SEEDED_CHECKINS);
    setPhase('client-dashboard');
  }

  function doCheckIn() {
    setCheckins(prev => [
      ...prev,
      { day_offset: 0, status: 'completed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  }

  function switchToProvider() {
    setPhase('provider-dashboard-updated');
  }

  function viewCourtReport() {
    setPhase('court-report');
  }

  const value = {
    phase,
    providerInfo,
    clientInfo,
    checkins,
    branding,
    lang,
    setLang,
    complianceSummary: DEMO_COMPLIANCE_SUMMARY,
    signUpProvider,
    setBranding,
    sendClientLink,
    switchToClient,
    completeOnboarding,
    doCheckIn,
    switchToProvider,
    viewCourtReport,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  return useContext(DemoContext);
}