import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import './MyBookings.css';

function MyBookings() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    axios.get(`http://localhost:5000/bookings/user/${userId}`)
      .then(res => setBookings(res.data))
      .catch(err => {
        console.error("Booking fetch error:", err);
        setError("Failed to fetch bookings");
      });
  }, [userId]);

  return (
    <div className="my-bookings-container">
      <h2>📋 My Bookings</h2>

      {error && <p className="error">{error}</p>}

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <table className="booking-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>License Plate</th>
              <th>Slot</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.booking_id}>
                <td>{b.booking_id}</td>
                <td>{b.license_plate}</td>
                <td>{b.slot_id}</td>
                <td>{new Date(b.booking_start_time).toLocaleString()}</td>
                <td>{new Date(b.booking_end_time).toLocaleString()}</td>
                <td>{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyBookings;
