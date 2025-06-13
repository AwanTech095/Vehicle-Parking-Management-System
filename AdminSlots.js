import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import './AdminSlots.css';

function AdminSlots() {
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const location = useLocation();
  const userId = location.state?.userId;

  const statusOptions = ['Available', 'Occupied', 'Reserved'];

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = () => {
    axios.get('http://localhost:5000/parkingSlots/with-records')
      .then(res => setSlots(res.data))
      .catch(() => setMessage("❌ Error fetching slots"));
  };

  const handleStatusChange = (slot_id, newStatus) => {
    axios.put('http://localhost:5000/parkingSlots/update-status', {
      slot_id,
      status: newStatus
    }).then(() => {
      setMessage("✅ Slot status updated");
      fetchSlots();
    }).catch(() => setMessage("❌ Failed to update slot"));
  };

  const handleExitTimeChange = (index, newValue) => {
    const updated = [...slots];
    updated[index].exit_time = newValue;
    setSlots(updated);
  };

  const handleExitTimeUpdate = (record_id, exit_time) => {
    if (!record_id || !exit_time) return;

    axios.put('http://localhost:5000/parkingRecords/update-exit-time', {
      record_id,
      exit_time: new Date(exit_time).toISOString()
    })
      .then(() => {
        setMessage("✅ Exit time updated!");
        fetchSlots();
      })
      .catch(() => setMessage("❌ Failed to update exit time"));
  };

  const formatToLocal = (utcString) => {
    if (!utcString) return "";
    const local = new Date(utcString);
    const offset = local.getTimezoneOffset();
    const localDate = new Date(local.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  return (
    <div className="admin-slots">
      <h2>🅿️ Manage Parking Slots</h2>
      {message && <p className="status-msg">{message}</p>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Slot ID</th>
              <th>Slot Number</th>
              <th>Vehicle Type</th>
              <th>Status</th>
              <th>Change Status</th>
              <th>Record ID</th>
              <th>Exit Time</th>
              <th>Update Exit Time</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, index) => (
              <tr key={slot.slot_id}>
                <td>{slot.slot_id}</td>
                <td>{slot.slot_number}</td>
                <td>{slot.vehicle_type}</td>
                <td>{slot.status}</td>
                <td>
                  <select
                    value={slot.status}
                    onChange={(e) => handleStatusChange(slot.slot_id, e.target.value)}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td>{slot.record_id || "N/A"}</td>
                <td>
                  <input
                    type="datetime-local"
                    className="exit-input"
                    value={formatToLocal(slot.exit_time)}
                    onChange={(e) => handleExitTimeChange(index, e.target.value)}
                    disabled={!slot.record_id}
                  />
                </td>
                <td>
                  <button
                    className="update-btn"
                    onClick={() => handleExitTimeUpdate(slot.record_id, slot.exit_time)}
                    disabled={!slot.record_id || !slot.exit_time}
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminSlots;
