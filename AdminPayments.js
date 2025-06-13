import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPayments.css'; // Import the dedicated CSS file

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:5000/payments/all')
      .then(res => {
        setPayments(res.data);
        const total = res.data.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        setTotalRevenue(total);
      })
      .catch(err => {
        setError("Failed to fetch payments");
        console.error(err);
      });
  }, []);

  return (
    <div className="admin-payments-container">
      <h2>💳 All Payments</h2>

      {error && <p className="error-message">{error}</p>}

      <h4 className="total-revenue">
        Total Revenue: <span>PKR {totalRevenue.toFixed(2)}</span>
      </h4>

      {payments.length === 0 ? (
        <p className="no-data">No payments found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Amount (PKR)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.payment_id}>
                  <td>{p.payment_id}</td>
                  <td>{p.amount}</td>
                  <td>
                    <span className={
                      p.payment_status === "Paid" ? "status-paid" :
                      p.payment_status === "Pending" ? "status-pending" :
                      "status-failed"
                    }>
                      {p.payment_status}
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

export default AdminPayments;
