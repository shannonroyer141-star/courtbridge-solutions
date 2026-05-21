import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Dashboard from './screens/Dashboard';
import CheckIn from './screens/CheckIn';
import Clients from './screens/Clients';
import Alerts from './screens/Alerts';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  if (!user) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1 style={{ color: "#1B3A6B" }}>CourtBridge Solutions</h1>
        <p>Please log in to continue.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav style={{ background: "#1B3A6B", width: "200px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h2 style={{ color: "white", fontSize: "14px", marginBottom: "20px" }}>CourtBridge Solutions</h2>
        <button onClick={() => setCurrentScreen('dashboard')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>📊 Dashboard</button>
        <button onClick={() => setCurrentScreen('checkin')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>📍 Check In</button>
        <button onClick={() => setCurrentScreen('clients')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>👥 Clients</button>
        <button onClick={() => setCurrentScreen('alerts')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>🔔 Alerts</button>
      </nav>

      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {currentScreen === 'dashboard' && <Dashboard />}
        {currentScreen === 'checkin' && <CheckIn />}
        {currentScreen === 'clients' && <Clients />}
        {currentScreen === 'alerts' && <Alerts />}
      </div>
    </div>
  );
}