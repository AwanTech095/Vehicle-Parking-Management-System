import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './MyPenalties.css';

function MyPenalties({ userId }) {
  const [penalties, setPenalties] = useState([]);
  const [message, setMessage] = useState("");

  const fetchPenalties = useCallback(() => {
    axios.get(`http://localhost:5000/penalties/user/${userId}`)
      .then(res => setPenalties(res.data))
      .catch(err => {
        console.error("Failed to load penalties", err);
        setMessage("❌ Failed to load penalties");
      });
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPenalties();
    }
  }, [userId, fetchPenalties]);

  const handlePayment = (penalty_id) => {
    axios.put(`http://localhost:5000/penalties/pay/${penalty_id}`)
      .then(() => {
        setMessage("✅ Penalty paid successfully");
        fetchPenalties();
      })
      .catch(err => {
        console.error("Payment failed", err);
        setMessage("❌ Failed to mark penalty as paid");
      });
  };

  return (
    <div className="penalties-container">
      <h2>📄 My Penalties</h2>
      {message && <p className={`status-msg ${message.startsWith("✅") ? "success" : "error"}`}>{message}</p>}

      {penalties.length === 0 ? (
        <p className="no-penalties">No penalties found ✅</p>
      ) : (
        <table className="penalties-table">
          <thead>
            <tr>
              <th>Penalty ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Vehicle</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {penalties.map(p => (
              <tr key={p.penalty_id}>
                <td>{p.penalty_id}</td>
                <td>{p.penalty_amount}</td>
                <td>{p.penalty_status}</td>
                <td>{p.reason || "-"}</td>
                <td>{new Date(p.entry_time).toLocaleString()}</td>
                <td>{p.exit_time ? new Date(p.exit_time).toLocaleString() : "-"}</td>
                <td>{p.license_plate}</td>
                <td>
                  {p.penalty_status === 'Unpaid' ? (
                    <button className="pay-button" onClick={() => handlePayment(p.penalty_id)}>💳 Pay</button>
                  ) : (
                    <span className="paid-badge">✅ Paid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyPenalties;
