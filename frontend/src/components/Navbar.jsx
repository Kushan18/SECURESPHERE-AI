import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <NavLink to={token ? "/" : "/login"} className="nav-brand">
        <div className="nav-brand-logo">S</div>
        <div className="nav-brand-text">Secure<span>Sphere AI</span></div>
      </NavLink>
      
      {token && (
        <div className="nav-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} 
            end
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/scans" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            Scans
          </NavLink>
          <NavLink 
            to="/chat" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            AI Chat
          </NavLink>
          <button onClick={handleLogout} className="nav-logout">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
