import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/login', {
        email,
        password,
        isAdmin: false // Set this to true if you are testing admin login
      });

      if (res.data.success) {
        const { user_id, role } = res.data;

        if (role === 'admin') {
          navigate('/admin-dashboard', { state: { userId: user_id } });
        } else {
          navigate('/driver-dashboard', { state: { userId: user_id } });
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg('Invalid email or password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome to Shalimar Slot Sync</h2>
        <p>Login to access your dashboard</p>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />

        <button onClick={handleLogin}>Login</button>

        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>
    </div>
  );
}

export default Login;


/*import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/login', {
        email,
        password,
        isAdmin: false // Set this to true if you are testing admin login
      });

      // Check if login is successful
      if (res.data.success) {
        const { user_id, role, token } = res.data; // Get the token

        // Store the token in localStorage
        localStorage.setItem('token', token);

        // Optionally store user info in localStorage for convenience
        localStorage.setItem('userId', user_id);
        localStorage.setItem('userRole', role);

        // Redirect based on the user's role
        if (role === 'admin') {
          navigate('/admin-dashboard', { state: { userId: user_id } });
        } else {
          navigate('/driver-dashboard', { state: { userId: user_id } });
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg('Invalid email or password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome to Shalimar Slot Sync</h2>
        <p>Login to access your dashboard</p>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />

        <button onClick={handleLogin}>Login</button>

        {errorMsg && <p className="error">{errorMsg}</p>}
      </div>
    </div>
  );
}

export default Login;*/

