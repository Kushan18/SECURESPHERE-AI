import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

function ScanResults() {
  const [scans, setScans] = useState([]);
  const [selectedScanId, setSelectedScanId] = useState('');
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiExplanations, setAiExplanations] = useState({}); // key: findingId, value: { loading, data, error }

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchHistoryAndLatest();
  }, []);

  const fetchHistoryAndLatest = async () => {
    setLoading(true);
    setError('');
    try {
      const historyRes = await axios.get(`${API_BASE_URL}/scan/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScans(historyRes.data);

      if (historyRes.data.length > 0) {
        const latestId = historyRes.data[0].id;
        setSelectedScanId(latestId);
        await fetchScanDetails(latestId);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch scans.');
    } finally {
      setLoading(false);
    }
  };

  const fetchScanDetails = async (scanId) => {
    setError('');
    try {
      const detailsRes = await axios.get(`${API_BASE_URL}/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFindings(detailsRes.data.findings);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch scan details.');
    }
  };

  const handleScanChange = (e) => {
    const scanId = e.target.value;
    setSelectedScanId(scanId);
    if (scanId) {
      fetchScanDetails(scanId);
    } else {
      setFindings([]);
    }
    setAiExplanations({}); // Clear previous explanations
  };

  const handleExplain = async (finding) => {
    setAiExplanations(prev => ({
      ...prev,
      [finding.id]: { loading: true, data: null, error: '' }
    }));

    try {
      const response = await axios.post(`${API_BASE_URL}/ai/explain`, {
        finding_id: finding.id,
        resource_name: finding.resource_name,
        resource_type: finding.resource_type,
        severity: finding.severity,
        description: finding.description,
        risk_score: finding.risk_score
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAiExplanations(prev => ({
        ...prev,
        [finding.id]: { loading: false, data: response.data, error: '' }
      }));
    } catch (err) {
      setAiExplanations(prev => ({
        ...prev,
        [finding.id]: { loading: false, data: null, error: err.response?.data?.detail || 'Failed to retrieve AI analysis.' }
      }));
    }
  };

  // Simple formatter to parse basic markdown lists and headers from AI
  const formatMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} style={{ marginTop: '12px', marginBottom: '6px', color: '#60a5fa', fontWeight: '600' }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} style={{ marginTop: '16px', marginBottom: '8px', color: '#8b5cf6', fontWeight: '700' }}>{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '4px', listStyleType: 'disc' }}>{line.substring(2)}</li>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '4px', listStyleType: 'decimal' }}>{line.replace(/^\d+\.\s/, '')}</li>;
      }
      return <p key={idx} style={{ marginBottom: '6px' }}>{line}</p>;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="findings-container">
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 className="chart-title" style={{ margin: 0 }}>Security Scan Findings</h3>
        
        {scans.length > 0 && (
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }} htmlFor="scan-selector">Select Scan:</label>
            <select 
              id="scan-selector"
              className="form-input" 
              value={selectedScanId} 
              onChange={handleScanChange}
              style={{ padding: '0.4rem 1.5rem 0.4rem 0.8rem', background: '#1e293b', cursor: 'pointer' }}
            >
              {scans.map(s => (
                <option key={s.id} value={s.id}>
                  {new Date(s.created_at).toLocaleString()} (Score: {s.score})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="error-close" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {findings.length > 0 ? (
        <div className="table-wrapper">
          <table className="findings-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => {
                const aiState = aiExplanations[f.id];
                return (
                  <React.Fragment key={f.id}>
                    <tr>
                      <td style={{ fontWeight: '600' }}>{f.resource_name}</td>
                      <td>{f.resource_type}</td>
                      <td>
                        <span className={`severity-badge ${f.severity.toLowerCase()}`}>
                          {f.severity}
                        </span>
                      </td>
                      <td style={{ color: '#cbd5e1', maxWidth: '400px' }}>{f.description}</td>
                      <td>
                        <button 
                          className="ai-btn"
                          onClick={() => handleExplain(f)}
                          disabled={aiState?.loading}
                        >
                          {aiState?.loading ? (
                            <>
                              <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                              Analyzing...
                            </>
                          ) : (
                            'Explain with AI'
                          )}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Render AI Advisor row if explanation exists */}
                    {aiState && (aiState.loading || aiState.data || aiState.error) && (
                      <tr>
                        <td colSpan="5">
                          <div className="ai-explanation-box">
                            <div className="ai-exp-header">
                              <span style={{ fontSize: '1.2rem' }}>✨</span> SecureSphere AI Advisor
                            </div>
                            
                            {aiState.loading && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
                                <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                                Synthesizing GCP vulnerability data and preparing remediation scripts...
                              </div>
                            )}

                            {aiState.error && (
                              <div style={{ color: '#ef4444' }}>
                                ⚠️ {aiState.error}
                              </div>
                            )}

                            {aiState.data && (
                              <div className="ai-exp-content">
                                <div>{formatMarkdown(aiState.data.explanation)}</div>
                                
                                {aiState.data.fix_command && (
                                  <div className="ai-command-box">
                                    <div className="ai-command-title">Remediation Script (gcloud CLI / Config)</div>
                                    <pre className="ai-command-code">{aiState.data.fix_command}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          No findings available. Navigate to the dashboard to trigger a new cloud security scan.
        </div>
      )}
    </div>
  );
}

export default ScanResults;
