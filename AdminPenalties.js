import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPenalties.css';

function AdminPenalties() {
  const [penalties, setPenalties] = useState([]);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    record_id: "",
    penalty_amount: "",
    reason: ""
  });

  useEffect(() => {
    fetchPenalties();
  }, []);

  const fetchPenalties = () => {
    axios.get("http://localhost:5000/penalties")
      .then(res => setPenalties(res.data))
      .catch(err => setMessage("❌ Error fetching penalties"));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddPenalty = () => {
    const { record_id, penalty_amount, reason } = formData;
    if (!record_id || !penalty_amount || !reason) {
      setMessage("❌ Please fill all fields.");
      return;
    }

    axios.post("http://localhost:5000/penalties", {
      record_id: parseInt(record_id),
      penalty_amount: parseFloat(penalty_amount),
      reason
    })
      .then(() => {
        setMessage("✅ Penalty added successfully.");
        setFormData({ record_id: "", penalty_amount: "", reason: "" });
        fetchPenalties();
      })
      .catch(err => {
        console.error(err);
        setMessage("❌ Failed to add penalty.");
      });
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>⚠️ View & Add Penalties</h2>

      {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}

      <h3>➕ Add Penalty</h3>
      <div>
        <input
          type="number"
          name="record_id"
          placeholder="Record ID"
          value={formData.record_id}
          onChange={handleChange}
        />
        <input
          type="number"
          name="penalty_amount"
          placeholder="Penalty Amount"
          value={formData.penalty_amount}
          onChange={handleChange}
        />
        <input
          type="text"
          name="reason"
          placeholder="Reason"
          value={formData.reason}
          onChange={handleChange}
        />
        <button onClick={handleAddPenalty}>Add Penalty</button>
      </div>

      <h3>📋 Existing Penalties</h3>
      <table>
        <thead>
          <tr>
            <th>Penalty ID</th>
            <th>Record ID</th>
            <th>Amount</th>
            <th>Reason</th>
            <th>Status</th>
            <th>License Plate</th>
          </tr>
        </thead>
        <tbody>
          {penalties.map(p => (
            <tr key={p.penalty_id}>
              <td>{p.penalty_id}</td>
              <td>{p.record_id}</td>
              <td>{p.penalty_amount}</td>
              <td>{p.reason}</td>
              <td>{p.penalty_status}</td>
              <td>{p.license_plate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPenalties;
