import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const handleLogin = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  if (session && profile) {
    if (profile.role === "provider") {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>🏛️ CourtBridge Solutions</h1>
          <p>Welcome, {profile.full_name} — <strong>Provider</strong></p>
          <hr />
          <h2>📋 Provider Dashboard</h2>
          <p>✅ Client list and check-in alerts coming next!</p>
          <button onClick={handleLogout} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
            Log Out
          </button>
        </div>
      );
    }
    if (profile.role === "client") {
      return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          <h1>🏛️ CourtBridge Solutions</h1>
          <p>Welcome, {profile.full_name} — <strong>Client</strong></p>
          <hr />
          <h2>📍 Check-In</h2>
          <p>✅ Check-in with GPS coming next!</p>
          <button onClick={handleLogout} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
            Log Out
          </button>
        </div>
      );
    }
  }

  if (session && !profile) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "400px" }}>
      <h1>🏛️ CourtBridge Solutions</h1>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: "0.5rem", width: "100%", padding: "0.5rem" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: "0.5rem", width: "100%", padding: "0.5rem" }}
      />
      <button onClick={handleLogin} style={{ padding: "0.5rem 1rem" }}>
        Log In
      </button>
    </div>
  );
}