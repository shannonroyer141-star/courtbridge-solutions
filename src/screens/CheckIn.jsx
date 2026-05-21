import React, { useState } from 'react';
import { supabase } from '../supabase';

export default function CheckIn() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleCheckIn() {
    setLoading(true);
    setMessage('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const now = new Date().toISOString();

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('Check_ins').insert({
          latitude,
          longitude,
          check_in_time: now
        });

        if (error) {
          setMessage('Something went wrong. Please try again.');
          console.log(error);
        } else {
          setMessage('✅ Check in successful!');
        }
        setLoading(false);
      },
      () => {
        setMessage('Could not get your location. Please allow location access.');
        setLoading(false);
      }
    );
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1 style={{ color: "#1B3A6B", marginBottom: "20px" }}>Check In</h1>
      <p style={{ marginBottom: "30px" }}>Press the button below to check in with your current location.</p>
      <button
        onClick={handleCheckIn}
        disabled={loading}
        style={{ background: "#1B3A6B", color: "white", padding: "20px 40px", fontSize: "20px", borderRadius: "10px", border: "none", cursor: "pointer" }}
      >
        {loading ? 'Checking in...' : '📍 Check In Now'}
      </button>
      {message && <p style={{ marginTop: "20px", fontSize: "18px" }}>{message}</p>}
    </div>
  );
}