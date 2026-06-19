import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('token');

  // Auto-scroll to bottom of chat when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError('');

    // Append user message to state
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Map frontend message roles to what backend expects
      // We pass the full history to let Gemini maintain context
      const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
        message: userMessage,
        history: messages
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      setError('Failed to send message. Please try again.');
      // Remove last user message on failure to allow retry, or just keep it and show error
    } finally {
      setLoading(false);
    }
  };

  // Basic formatting helper for chat bubble markdown
  const renderMessageContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold formatter
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const contentToRender = parts.length > 0 ? parts : line;

      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={idx} style={{ marginLeft: '1rem', marginBottom: '4px', listStyleType: 'disc' }}>{contentToRender}</li>;
      }
      if (line.startsWith('### ')) {
        return <h5 key={idx} style={{ marginTop: '8px', marginBottom: '4px', color: '#60a5fa' }}>{line.replace('### ', '')}</h5>;
      }
      if (line.startsWith('## ')) {
        return <h4 key={idx} style={{ marginTop: '12px', marginBottom: '6px', color: '#8b5cf6' }}>{line.replace('## ', '')}</h4>;
      }
      return <p key={idx} style={{ marginBottom: '4px' }}>{contentToRender}</p>;
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span className="chat-status"></span>
        <div className="chat-title-text">SecureSphere AI Security Copilot</div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">🤖</div>
            <h3>How can I assist your Cloud Security today?</h3>
            <p style={{ maxWidth: '450px', fontSize: '0.9rem' }}>
              Ask me about GCP IAM best practices, remediation commands for firewall rules, storage encryption, Kubernetes configurations, or compliance standards (CIS, NIST, SOC2).
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.role}`}>
              <div className="message-bubble">
                {renderMessageContent(msg.content)}
              </div>
              <div className="message-meta">
                {msg.role === 'user' ? 'You' : 'AI Copilot'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="chat-message assistant">
            <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
              <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
              SecureSphere is analyzing and crafting a response...
            </div>
          </div>
        )}

        {error && (
          <div className="chat-message assistant">
            <div className="message-bubble" style={{ border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
              ⚠️ {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your security question here... (e.g. 'How do I restrict port 22 in gcloud?')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChat;
