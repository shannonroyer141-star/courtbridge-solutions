import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setAlerts(data);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ color: "#1B3A6B", marginBottom: "20px" }}>Alerts</h1>
      {alerts.length === 0 ? (
        <p>No alerts at this time. 🎉</p>
      ) : (
        alerts.map(alert => (
          <div key={alert.id} style={{ background: "#E74C3C", color: "white", padding: "15px", borderRadius: "10px", marginBottom: "10px" }}>
            <p style={{ margin: 0 }}>⚠️ {alert.message || "Missed check-in"}</p>
            <p style={{ margin: 0, fontSize: "12px" }}>{new Date(alert.created_at).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
}