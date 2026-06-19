import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password
        });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      } else {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          username,
          email,
          password
        });
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">SecureSphere AI</h1>
          <p className="auth-subtitle">Cloud Security Intelligence Platform</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button 
            type="button" 
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button className="error-close" onClick={() => setError('')}>&times;</button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input 
                className="form-input"
                id="username"
                type="text" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input 
              className="form-input"
              id="email"
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input 
              className="form-input"
              id="password"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
