import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Dashboard from './screens/Dashboard';
import CheckIn from './screens/CheckIn';
import Clients from './screens/Clients';
import Alerts from './screens/Alerts';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('Invalid email or password.');
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (!user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f4f6f9" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "12px", width: "350px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <h1 style={{ color: "#1B3A6B", textAlign: "center", marginBottom: "30px", fontSize: "24px" }}>CourtBridge Solutions</h1>
          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box", fontSize: "16px" }}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box", fontSize: "16px" }}
          />
          {loginError && <p style={{ color: "red", marginBottom: "10px" }}>{loginError}</p>}
          <button onClick={handleLogin} style={{ width: "100%", padding: "12px", background: "#1B3A6B", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", cursor: "pointer" }}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <nav style={{ background: "#1B3A6B", width: "200px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h2 style={{ color: "white", fontSize: "16px", marginBottom: "20px" }}>CourtBridge Solutions</h2>
        <button onClick={() => setCurrentScreen('dashboard')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>📊 Dashboard</button>
        <button onClick={() => setCurrentScreen('checkin')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>📍 Check In</button>
        <button onClick={() => setCurrentScreen('clients')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>👥 Clients</button>
        <button onClick={() => setCurrentScreen('alerts')} style={{ color: "white", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "10px", fontSize: "16px" }}>🔔 Alerts</button>
        <div style={{ marginTop: "auto" }}>
          <button onClick={handleLogout} style={{ color: "white", background: "#E74C3C", border: "none", cursor: "pointer", padding: "10px", fontSize: "14px", borderRadius: "8px", width: "100%" }}>🚪 Log Out</button>
        </div>
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