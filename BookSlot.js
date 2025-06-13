/*import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './BookSlot.css';

function BookSlot() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState(null);
  const [message, setMessage] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!userId) return;
    axios.post("http://localhost:5000/userVehicles", { user_id: userId })
      .then(res => setVehicles(res.data))
      .catch(err => console.error("Failed to load vehicles", err));

    axios.get(`http://localhost:5000/bookings/user/${userId}`)
      .then(res => setBookings(res.data))
      .catch(err => console.error("Failed to fetch bookings", err));
  }, [userId]);

  useEffect(() => {
    const selectedVehicle = vehicles.find(v => v.user_vehicle_id === parseInt(selectedVehicleId));
    if (selectedVehicle) {
      axios.post("http://localhost:5000/parkingSlots/available", {
        vehicle_type: selectedVehicle.vehicle_type
      })
        .then(res => setSlots(res.data))
        .catch(err => console.error("Failed to load slots", err));
    }
  }, [selectedVehicleId, vehicles]);

  const handleBooking = async () => {
    const formatDateTime = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleString("sv-SE").replace(" ", "T");
    };

    if (!selectedVehicleId || !selectedSlotId || !startTime || !endTime) {
      setMessage("❌ Please fill all fields.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/book-and-pay", {
        user_vehicle_id: parseInt(selectedVehicleId),
        slot_id: parseInt(selectedSlotId),
        booking_start_time: formatDateTime(startTime),
        booking_end_time: formatDateTime(endTime)
      });

      setMessage("✅ Booking successful!");
      setPrice(res.data.price);
    } catch (err) {
      console.error("❌ Booking failed:", err.response?.data || err.message);
      setMessage("❌ Booking failed. Conflict or server error.");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.post("http://localhost:5000/cancel-booking", { booking_id: bookingId });
      setMessage("✅ Booking cancelled");
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: "Cancelled" } : b));
    } catch (err) {
      console.error("❌ Cancel booking failed:", err);
      setMessage("❌ Failed to cancel booking");
    }
  };

  return (
    <div className="book-slot-container">
      <h2>📍 Book a Parking Slot</h2>

      <label>Select Your Vehicle:</label>
      <select onChange={(e) => setSelectedVehicleId(e.target.value)} value={selectedVehicleId}>
        <option value="">-- Select --</option>
        {vehicles.map(v => (
          <option key={v.user_vehicle_id} value={v.user_vehicle_id}>
            {v.license_plate} ({v.vehicle_type})
          </option>
        ))}
      </select>

      <label>Select Available Slot:</label>
      <select onChange={(e) => setSelectedSlotId(e.target.value)} value={selectedSlotId}>
        <option value="">-- Select --</option>
        {slots.map(s => (
          <option key={s.slot_id} value={s.slot_id}>
            {s.slot_number} ({s.vehicle_type})
          </option>
        ))}
      </select>

      <label>Booking Start Time:</label>
      <input type="datetime-local" onChange={(e) => setStartTime(e.target.value)} value={startTime} />

      <label>Booking End Time:</label>
      <input type="datetime-local" onChange={(e) => setEndTime(e.target.value)} value={endTime} />

      <button onClick={handleBooking}>📅 Confirm Booking</button>

      {message && (
        <p style={{ marginTop: '10px', color: message.startsWith("✅") ? "green" : "red" }}>
          {message}
        </p>
      )}

      {price !== null && (
        <p>Total Price: <strong>Rs {price}</strong></p>
      )}

      <hr />
      <h3>📌 Your Bookings</h3>

      <table className="booking-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Vehicle</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Cancel</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.booking_id}>
              <td>{b.booking_id}</td>
              <td>{b.license_plate}</td>
              <td>{new Date(b.booking_start_time).toLocaleString()}</td>
              <td>{new Date(b.booking_end_time).toLocaleString()}</td>
              <td>{b.status}</td>
              <td>
                {b.status === "Confirmed" && (
                  <button onClick={() => handleCancelBooking(b.booking_id)}>❌ Cancel</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BookSlot;
*/
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './BookSlot.css';

function BookSlot() {
  const location = useLocation();
  const userId = location.state?.userId;

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState(null);
  const [message, setMessage] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!userId) return;

    axios.post("http://localhost:5000/userVehicles", { user_id: userId })
      .then(res => setVehicles(res.data))
      .catch(err => console.error("Failed to load vehicles", err));

    axios.get(`http://localhost:5000/bookings/user/${userId}`)
      .then(res => setBookings(res.data))
      .catch(err => console.error("Failed to fetch bookings", err));
  }, [userId]);

  useEffect(() => {
    const selectedVehicle = vehicles.find(v => v.user_vehicle_id === parseInt(selectedVehicleId));
    if (selectedVehicle) {
      axios.post("http://localhost:5000/parkingSlots/available", {
        vehicle_type: selectedVehicle.vehicle_type
      })
        .then(res => setSlots(res.data))
        .catch(err => console.error("Failed to load slots", err));
    }
  }, [selectedVehicleId, vehicles]);

  const handleBooking = async () => {
    const formatDateTime = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleString("sv-SE").replace(" ", "T");
    };

    if (!selectedVehicleId || !selectedSlotId || !startTime || !endTime) {
      setMessage("❌ Please fill all fields.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/book-and-pay", {
        user_vehicle_id: parseInt(selectedVehicleId),
        slot_id: parseInt(selectedSlotId),
        booking_start_time: formatDateTime(startTime),
        booking_end_time: formatDateTime(endTime)
      });

      setMessage("✅ Booking successful!");
      setPrice(res.data.price);

      // Refresh bookings after new booking
      axios.get(`http://localhost:5000/bookings/user/${userId}`)
        .then(res => setBookings(res.data));

    } catch (err) {
      const msg = err.response?.data?.error || "❌ Booking failed. Conflict or server error.";
      console.error("❌ Booking failed:", msg);
      setMessage(msg);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await axios.post("http://localhost:5000/cancel-booking", { booking_id: bookingId });
      setMessage("✅ Booking cancelled");
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: "Cancelled" } : b));
    } catch (err) {
      console.error("❌ Cancel booking failed:", err);
      setMessage("❌ Failed to cancel booking");
    }
  };

  return (
    <div className="book-slot-container">
      <h2>📍 Book a Parking Slot</h2>

      <label>Select Your Vehicle:</label>
      <select onChange={(e) => setSelectedVehicleId(e.target.value)} value={selectedVehicleId}>
        <option value="">-- Select --</option>
        {vehicles.map(v => (
          <option key={v.user_vehicle_id} value={v.user_vehicle_id}>
            {v.license_plate} ({v.vehicle_type})
          </option>
        ))}
      </select>

      <label>Select Available Slot:</label>
      <select onChange={(e) => setSelectedSlotId(e.target.value)} value={selectedSlotId}>
        <option value="">-- Select --</option>
        {slots.map(s => (
          <option key={s.slot_id} value={s.slot_id}>
            {s.slot_number} ({s.vehicle_type})
          </option>
        ))}
      </select>

      <label>Booking Start Time:</label>
      <input type="datetime-local" onChange={(e) => setStartTime(e.target.value)} value={startTime} />

      <label>Booking End Time:</label>
      <input type="datetime-local" onChange={(e) => setEndTime(e.target.value)} value={endTime} />

      <button onClick={handleBooking}>📅 Confirm Booking</button>

      {message && (
        <p style={{ marginTop: '10px', color: message.startsWith("✅") ? "green" : "red" }}>
          {message}
        </p>
      )}

      {price !== null && (
        <p>Total Price: <strong>Rs {price}</strong></p>
      )}

      <hr />
      <h3>📌 Your Bookings</h3>

      <table className="booking-table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Vehicle</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Cancel</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.booking_id}>
              <td>{b.booking_id}</td>
              <td>{b.license_plate}</td>
              <td>{new Date(b.booking_start_time).toLocaleString()}</td>
              <td>{new Date(b.booking_end_time).toLocaleString()}</td>
              <td>{b.status}</td>
              <td>
                {b.status === "Confirmed" && (
                  <button onClick={() => handleCancelBooking(b.booking_id)}>❌ Cancel</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BookSlot;

