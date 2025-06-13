import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    try {
      const res = await axios.post('http://localhost:5000/signup', {
        name,
        email,
        contact_number: contactNumber,
        password,
        vehicle_type: vehicleType,
        license_plate: licensePlate,
      });

      if (res.data.success) {
        // If signup is successful, navigate to the login page
        navigate('/login');
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setErrorMsg('Failed to create an account. Please try again.');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Create an Account</h2>

        <input
          type="text"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <input
          type="text"
          placeholder="Contact Number"
          onChange={(e) => setContactNumber(e.target.value)}
          value={contactNumber}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />

        <input
          type="text"
          placeholder="Vehicle Type"
          onChange={(e) => setVehicleType(e.target.value)}
          value={vehicleType}
        />

        <input
          type="text"
          placeholder="License Plate"
          onChange={(e) => setLicensePlate(e.target.value)}
          value={licensePlate}
        />

        <button onClick={handleSignup}>Sign Up</button>

        {errorMsg && <p className="error">{errorMsg}</p>}

        <p>Already have an account? <span onClick={() => navigate('/login')}>Login here</span></p>
        <p>Admin? <span onClick={() => navigate('/login')}>Login as Admin</span></p>
      </div>
    </div>
  );
}

export default Signup;
