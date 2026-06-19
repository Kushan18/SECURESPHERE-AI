import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ScanResults from './components/ScanResults';
import AIChat from './components/AIChat';
import Login from './components/Login';
import './App.css';

// Route Guard to verify JWT before rendering protected components
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth route */}
        <Route path="/login" element={
          <div className="app-container">
            <Navbar />
            <Login />
          </div>
        } />

        {/* Protected Dashboard route */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Protected Scans / findings route */}
        <Route path="/scans" element={
          <ProtectedRoute>
            <ScanResults />
          </ProtectedRoute>
        } />

        {/* Protected AI advisor chat route */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <AIChat />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
