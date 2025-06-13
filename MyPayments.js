import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './MyPayments.css';

function MyPayments() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    axios.get(`http://localhost:5000/payments/user/${userId}`)
      .then(res => setPayments(res.data))
      .catch(err => {
        console.error("Failed to load payments:", err);
        setError("Error fetching payments");
      });
  }, [userId]);

  return (
    <div className="my-payments-container">
      <h2>💳 My Payments</h2>
      {error && <p className="error">{error}</p>}

      {payments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <table className="payments-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>License Plate</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, index) => (
              <tr key={`${p.payment_id}-${index}`}>
                <td>{p.payment_id}</td>
                <td>{p.license_plate || "N/A"}</td>
                <td>{p.amount}</td>
                <td>{p.payment_status}</td>
                <td>{p.entry_time ? new Date(p.entry_time).toLocaleString() : "N/A"}</td>
                <td>{p.exit_time ? new Date(p.exit_time).toLocaleString() : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MyPayments;
