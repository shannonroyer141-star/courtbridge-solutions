import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Dashboard() {
  const [totalClients, setTotalClients] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const { count } = await supabase
      .from('Clients')
      .select('*', { count: 'exact', head: true });
    setTotalClients(count || 0);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ color: "#1B3A6B", marginBottom: "30px" }}>Dashboard</h1>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ background: "#1B3A6B", color: "white", padding: "30px", borderRadius: "12px", minWidth: "160px", textAlign: "center" }}>
          <h2 style={{ fontSize: "48px", margin: 0 }}>{totalClients}</h2>
          <p style={{ margin: 0, fontSize: "14px" }}>Total Clients</p>
        </div>
        <div style={{ background: "#2ECC71", color: "white", padding: "30px", borderRadius: "12px", minWidth: "160px", textAlign: "center" }}>
          <h2 style={{ fontSize: "48px", margin: 0 }}>0</h2>
          <p style={{ margin: 0, fontSize: "14px" }}>Checked In Today</p>
        </div>
        <div style={{ background: "#E74C3C", color: "white", padding: "30px", borderRadius: "12px", minWidth: "160px", textAlign: "center" }}>
          <h2 style={{ fontSize: "48px", margin: 0 }}>0</h2>
          <p style={{ margin: 0, fontSize: "14px" }}>Missed Today</p>
        </div>
        <div style={{ background: "#F39C12", color: "white", padding: "30px", borderRadius: "12px", minWidth: "160px", textAlign: "center" }}>
          <h2 style={{ fontSize: "48px", margin: 0 }}>0</h2>
          <p style={{ margin: 0, fontSize: "14px" }}>Alerts</p>
        </div>
      </div>
    </div>
  );
}