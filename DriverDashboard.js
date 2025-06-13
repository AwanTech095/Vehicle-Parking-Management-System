import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DriverDashboard.css';

function DriverDashboard() {
  const location = useLocation();
  const userId = location.state?.userId;
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path, { state: { userId } });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h2>🚗 Driver Dashboard</h2>
        <p className="welcome">Welcome to your panel! What would you like to do?</p>

        <div className="button-group">
          <button onClick={() => handleNavigation('/book-slot')}>📅 Book a Slot</button>
          <button onClick={() => handleNavigation('/my-bookings')}>🗂️ View My Bookings</button>
          <button onClick={() => handleNavigation('/my-payments')}>💳 My Payments</button>
          <button onClick={() => handleNavigation('/membership')}>💼 Select Membership</button>
          <button onClick={() => handleNavigation('/my-penalties')}>📄 View My Penalties</button> {/* ✅ NEW BUTTON */}
        </div>
      </div>
    </div>
  );
}

export default DriverDashboard;
