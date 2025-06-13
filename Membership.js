import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './Membership.css';

function Membership() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/memberships")
      .then(res => setPlans(res.data))
      .catch(err => console.error("Error fetching memberships", err));
  }, []);

  useEffect(() => {
    if (!userId) return;
    axios.get("http://localhost:5000/user-memberships/active")
      .then(res => {
        const userActive = res.data.find(m => m.user_id === userId);
        setActivePlan(userActive || null);
      })
      .catch(err => console.error("Error fetching active membership", err));
  }, [userId]);

  const handleSelect = async (membershipId) => {
    try {
      await axios.post("http://localhost:5000/select-membership", {
        user_id: userId,
        membership_id: membershipId
      });
      setMessage("✅ Membership selected successfully");
      setActivePlan({ membership_id: membershipId });
    } catch (err) {
      const msg = err.response?.data?.error || "❌ Failed to select plan";
      setMessage(msg);
    }
  };

  const handleCancel = async () => {
    try {
      await axios.post("http://localhost:5000/cancel-membership", { user_id: userId });
      setActivePlan(null);
      setMessage("❌ Membership cancelled");
    } catch (err) {
      const msg = err.response?.data?.error || "❌ Failed to cancel";
      setMessage(msg);
    }
  };

  return (
    <div className="membership-container">
      <h2>📋 Membership Plans</h2>

      {activePlan && (
        <div className="active-membership">
          <strong>Subscribed Plan:</strong> {activePlan.plan_name || "Plan ID: " + activePlan.membership_id}
          <br />
          <button className="cancel-button" onClick={handleCancel}>❌ Cancel Membership</button>
        </div>
      )}

      <table className="membership-table">
        <thead>
          <tr>
            <th>Plan Name</th>
            <th>Fee</th>
            <th>Duration (days)</th>
            <th>Discount (%)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(plan => (
            <tr key={plan.membership_id}>
              <td>{plan.plan_name}</td>
              <td>{plan.fee}</td>
              <td>{plan.duration}</td>
              <td>{plan.discount}</td>
              <td>
                <button
                  className="select-button"
                  disabled={!!activePlan}
                  onClick={() => handleSelect(plan.membership_id)}
                >
                  {activePlan ? "Already Subscribed" : "Select Plan"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {message && (
        <p className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Membership;
