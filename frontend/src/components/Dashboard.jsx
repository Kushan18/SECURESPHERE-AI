import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

const API_BASE_URL = 'http://127.0.0.1:8000';

function Dashboard() {
  const [scans, setScans] = useState([]);
  const [latestScan, setLatestScan] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const historyRes = await axios.get(`${API_BASE_URL}/scan/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScans(historyRes.data);
      
      if (historyRes.data.length > 0) {
        const latestId = historyRes.data[0].id;
        const detailsRes = await axios.get(`${API_BASE_URL}/scan/${latestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLatestScan(detailsRes.data.scan);
        setFindings(detailsRes.data.findings);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch scan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    setError('');
    try {
      const runRes = await axios.post(`${API_BASE_URL}/scan/run`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLatestScan(runRes.data.scan);
      setFindings(runRes.data.findings);
      
      // Update scan history list
      const historyRes = await axios.get(`${API_BASE_URL}/scan/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScans(historyRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to execute scan.');
    } finally {
      setScanning(false);
    }
  };

  const selectHistoricalScan = async (scanId) => {
    setError('');
    try {
      const detailsRes = await axios.get(`${API_BASE_URL}/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLatestScan(detailsRes.data.scan);
      setFindings(detailsRes.data.findings);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch scan details.');
    }
  };

  // Prepare Pie Chart Data (Findings by Severity)
  const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  findings.forEach(f => {
    if (severityCounts[f.severity] !== undefined) {
      severityCounts[f.severity]++;
    }
  });

  const pieData = Object.keys(severityCounts).map(key => ({
    name: key,
    value: severityCounts[key]
  })).filter(item => item.value > 0);

  const SEVERITY_COLORS = {
    CRITICAL: '#ef4444',
    HIGH: '#ea580c',
    MEDIUM: '#d97706',
    LOW: '#10b981'
  };

  // Prepare Bar Chart Data (Findings by Resource Type)
  const resourceCounts = {};
  findings.forEach(f => {
    resourceCounts[f.resource_type] = (resourceCounts[f.resource_type] || 0) + 1;
  });

  const barData = Object.keys(resourceCounts).map(key => ({
    name: key,
    count: resourceCounts[key]
  }));

  // Helper for rendering security score styling classes
  const getScoreClass = (score) => {
    if (score >= 80) return 'stat-score-value';
    if (score >= 50) return 'stat-score-value warning';
    return 'stat-score-value danger';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="error-close" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {/* Greeting Banner */}
      <div className="action-banner">
        <div className="banner-text">
          <h2>Welcome to SecureSphere, {user.username || 'Security Analyst'}!</h2>
          <p>Scan your cloud infrastructure configurations to detect exposures, overprivileged accounts, and misconfigured networks.</p>
        </div>
        <button 
          className="scan-btn" 
          onClick={handleRunScan} 
          disabled={scanning}
        >
          {scanning ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
              Scanning GCP...
            </>
          ) : (
            'Run New Scan'
          )}
        </button>
      </div>

      {latestScan ? (
        <>
          {/* Stats Overview */}
          <div className="dashboard-grid">
            <div className="stat-card">
              <span className="stat-title">Security Score</span>
              <span className={`stat-value ${getScoreClass(latestScan.score)}`}>
                {latestScan.score}/100
              </span>
              <span className="stat-sub">Based on finding severities</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Total Findings</span>
              <span className="stat-value">{latestScan.total_findings}</span>
              <span className="stat-sub">Identified misconfigurations</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">Critical Issues</span>
              <span className="stat-value" style={{ color: SEVERITY_COLORS.CRITICAL }}>
                {latestScan.critical_findings}
              </span>
              <span className="stat-sub">Require immediate attention</span>
            </div>
            <div className="stat-card">
              <span className="stat-title">High Severity</span>
              <span className="stat-value" style={{ color: SEVERITY_COLORS.HIGH }}>
                {latestScan.high_findings}
              </span>
              <span className="stat-sub">Exploitable conditions</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Findings by Severity</h3>
              <div className="chart-container">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#3b82f6'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#94a3b8' }}>No findings to display.</p>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3 className="chart-title">Findings by Resource Type</h3>
              <div className="chart-container">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#3b82f6" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ color: '#94a3b8' }}>No findings to display.</p>
                )}
              </div>
            </div>
          </div>

          {/* Historical Scans Section */}
          <div className="findings-container">
            <h3 className="chart-title">Scan History</h3>
            <div className="scan-history-list">
              {scans.map((s) => (
                <div 
                  key={s.id} 
                  className={`scan-history-item ${latestScan.id === s.id ? 'active' : ''}`}
                  onClick={() => selectHistoricalScan(s.id)}
                >
                  <div className="scan-meta">
                    <span className="scan-date">{new Date(s.created_at).toLocaleString()}</span>
                    <span className="scan-counts">
                      Findings: {s.total_findings} | Critical: {s.critical_findings} | High: {s.high_findings} | Med: {s.medium_findings} | Low: {s.low_findings}
                    </span>
                  </div>
                  <div className={`scan-score-badge ${s.score >= 80 ? 'high-score' : s.score >= 50 ? 'med-score' : 'low-score'}`}>
                    Score: {s.score}/100
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="stat-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem' }}>No Scan History Found</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            It looks like you haven't run any security scans yet. Click the button below to initiate your first GCP infrastructure scan!
          </p>
          <button 
            className="scan-btn" 
            onClick={handleRunScan} 
            disabled={scanning}
            style={{ margin: '0 auto' }}
          >
            {scanning ? 'Running First Scan...' : 'Start Initial Security Scan'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
