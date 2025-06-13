import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminBookings.css';

function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get('http://localhost:5000/bookings/all')
      .then(res => setBookings(res.data))
      .catch(err => {
        console.error("Error:", err);
        setError("❌ Failed to fetch bookings");
      });
  }, []);

  return (
    <div className="admin-bookings">
      <h2>📋 All Bookings</h2>
      {error && <p className="status-msg error">{error}</p>}

      {bookings.length === 0 ? (
        <p className="status-msg">No bookings found.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Vehicle</th>
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
                  <td>{b.user_name}</td>
                  <td>{b.license_plate}</td>
                  <td>{b.slot_number}</td>
                  <td>{new Date(b.booking_start_time).toLocaleString()}</td>
                  <td>{new Date(b.booking_end_time).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;
