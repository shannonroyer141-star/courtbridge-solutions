import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    checkedInToday: 0,
    missedToday: 0,
    alerts: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    setStats(prev => ({ ...prev, totalClients: totalClients || 0 }));
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ color: "#1B3A6B", marginBottom: "20px" }}>Dashboard</h1>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ background: "#1B3A6B", color: "white", padding: "20px", borderRadius: "10px", minWidth: "150px" }}>
          <h2 style={{ fontSize: "36px", margin: 0 }}>{stats.totalClients}</h2>
          <p style={{ margin: 0 }}>Total Clients</p>
        </div>
        <div style={{ background: "#2ECC71", color: "white", padding: "20px", borderRadius: "10px", minWidth: "150px" }}>
          <h2 style={{ fontSize: "36px", margin: 0 }}>{stats.checkedInToday}</h2>
          <p style={{ margin: 0 }}>Checked In Today</p>
        </div>
        <div style={{ background: "#E74C3C", color: "white", padding: "20px", borderRadius: "10px", minWidth: "150px" }}>
          <h2 style={{ fontSize: "36px", margin: 0 }}>{stats.missedToday}</h2>
          <p style={{ margin: 0 }}>Missed Today</p>
        </div>
        <div style={{ background: "#F39C12", color: "white", padding: "20px", borderRadius: "10px", minWidth: "150px" }}>
          <h2 style={{ fontSize: "36px", margin: 0 }}>{stats.alerts}</h2>
          <p style={{ margin: 0 }}>Alerts</p>
        </div>
      </div>
    </div>
  );
}