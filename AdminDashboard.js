/*import React, { useEffect, useState } from 'react';
import axios from 'axios';

function AdminDashboard() {
  const [revenue, setRevenue] = useState(0);
  const [slotUsage, setSlotUsage] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    // Total revenue
    axios.get("http://localhost:5000/payments/revenue")
      .then(res => setRevenue(res.data.total_revenue || 0))
      .catch(err => console.error("Revenue fetch error:", err));

    // Slot usage
    axios.get("http://localhost:5000/parkingSlots/utilization")
      .then(res => setSlotUsage(res.data))
      .catch(err => console.error("Slot usage fetch error:", err));

    // Pending payments
    axios.get("http://localhost:5000/payments?status=Pending")
      .then(res => setPendingPayments(res.data))
      .catch(err => console.error("Pending payments error:", err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Admin Dashboard</h2>
      <p><strong>Total Revenue:</strong> ${revenue.toFixed(2)}</p>

      <h3>Parking Slot Usage</h3>
      <ul>
        {slotUsage.map((s, index) => (
          <li key={index}>{s.vehicle_type} - {s.status}: {s.total}</li>
        ))}
      </ul>

      <h3>Pending Payments</h3>
      <ul>
        {pendingPayments.map(p => (
          <li key={p.payment_id}>
            Record #{p.record_id} — ${p.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;
*/
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const location = useLocation();
  const userId = location.state?.userId; // can be used later for logging/audit
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path, { state: { userId } });
  };

  return (
    <div className="admin-container">
      <div className="admin-box">
        <h2>🛠️ Admin Dashboard</h2>
        <p className="admin-welcome">Welcome Admin! Manage the system below:</p>

        <div className="admin-buttons">
          <button onClick={() => handleNavigation('/admin/slots')}> Manage Parking Slots</button>
          <button onClick={() => handleNavigation('/admin/bookings')}>📋 View All Bookings</button>
          <button onClick={() => handleNavigation('/admin/payments')}>💳 All Payments</button>
          <button onClick={() => handleNavigation('/admin/penalties')}>⚠️ View and Add Penalties</button>
          <button onClick={() => handleNavigation('/admin/users')}>👥 View All Users</button>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
