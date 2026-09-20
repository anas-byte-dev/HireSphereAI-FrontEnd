import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

const DEFAULT_ROLES = [
  'Full-Stack Software Engineer',
  'Java Backend Engineer',
  'React Frontend Developer',
  'Cloud & DevOps Specialist',
  'Data & AI Engineer'
];

export default function AiInterview() {
  const { user } = useAuth();
  const { isConnected } = useRealtime();

  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLES[0]);
  const [customRole, setCustomRole] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  const chatEndRef = useRef(null);

  const activeRole = customRole.trim() ? customRole.trim() : selectedRole;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const candidateId = user ? user.id : 3;
      const res = await axiosClient.post('/ai/interview/start', null, {
        params: {
          candidateId,
          jobRole: activeRole,
        },
      });

      setSessionId(res.data.sessionId);
      setMessages([res.data]);
      setSessionScore(res.data.score || 100);
    } catch (err) {
      console.error('Failed to start interview session:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading || !sessionId) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Optimistically add candidate's response
    const tempCandidateMsg = {
      id: Date.now(),
      sessionId,
      sender: 'CANDIDATE',
      message: userText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempCandidateMsg]);
    setLoading(true);

    try {
      const candidateId = user ? user.id : 3;
      const res = await axiosClient.post('/ai/interview/message', {
        sessionId,
        candidateId,
        jobRole: activeRole,
        message: userText,
      });

      setMessages((prev) => [...prev, res.data]);
      if (res.data.score) {
        setSessionScore(res.data.score);
      }
    } catch (err) {
      console.error('Failed to send interview message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <span>🤖 HireSphere AI Interview Coach</span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isConnected ? '#16a34a' : '#dc2626',
                fontWeight: 600,
              }}
            >
              {isConnected ? '⚡ Real-Time DB Connected' : 'Connecting Real-Time DB...'}
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', margin: '0.4rem 0 0' }}>
            Interactive turn-by-turn mock interview with autonomous AI coaching, instant scoring, and real-time database transcript logging.
          </p>
        </div>
      </div>

      {/* Configuration Bar */}
      {!sessionId ? (
        <div className="card" style={{ maxWidth: '640px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Select Your Target Job Role</h3>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            The AI agent adapts its technical depth, behavioral scenarios, and evaluation metrics specifically to your selected role.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {DEFAULT_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => { setSelectedRole(role); setCustomRole(''); }}
                className={selectedRole === role && !customRole ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ fontSize: '0.85rem' }}
              >
                {role}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
              Or type a custom job title:
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Site Reliability Engineer"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="form-control"
              style={{ width: '100%', marginTop: '0.4rem', padding: '0.6rem 0.8rem' }}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartSession}
            disabled={starting}
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', fontWeight: 600 }}
          >
            {starting ? 'Initializing AI Interviewer...' : `🚀 Start Interview for "${activeRole}"`}
          </button>
        </div>
      ) : (
        /* Chat Session Chamber */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Main Conversation Chamber */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: 0, overflow: 'hidden' }}>
            {/* Chamber Topbar */}
            <div
              style={{
                padding: '0.9rem 1.25rem',
                background: 'var(--bg-card-header, #f8fafc)',
                borderBottom: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem' }}>Role: {activeRole}</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.75rem' }}>
                  Session #{sessionId.slice(0, 8)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setSessionId('')}
              >
                End & New Session
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender === 'CANDIDATE' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '12px',
                      background:
                        msg.sender === 'CANDIDATE'
                          ? 'var(--primary-color, #2563eb)'
                          : 'var(--bg-secondary, #f1f5f9)',
                      color: msg.sender === 'CANDIDATE' ? '#ffffff' : 'var(--text-primary, #0f172a)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      lineHeight: 1.5,
                      fontSize: '0.95rem',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', opacity: 0.8, marginBottom: '0.3rem', fontWeight: 600 }}>
                      {msg.sender === 'CANDIDATE' ? 'You (Candidate)' : '🤖 HireSphere AI Interviewer'}
                    </div>
                    <div>{msg.message}</div>
                  </div>

                  {/* AI Feedback Card */}
                  {msg.sender === 'AI' && msg.feedback && (
                    <div
                      style={{
                        marginTop: '0.4rem',
                        maxWidth: '82%',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderLeft: '3px solid #f59e0b',
                        fontSize: '0.82rem',
                        color: '#92400e',
                      }}
                    >
                      💡 <strong>Coach Feedback:</strong> {msg.feedback}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  <span>AI Coach is evaluating your response and formulating the next question...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.9rem 1.25rem',
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                background: '#ffffff',
              }}
            >
              <input
                type="text"
                placeholder="Type your response to the interviewer..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="form-control"
                style={{ flex: 1, padding: '0.7rem 0.9rem', fontSize: '0.95rem' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !inputMessage.trim()}
                style={{ padding: '0.7rem 1.5rem', fontWeight: 600 }}
              >
                Send Answer
              </button>
            </form>
          </div>

          {/* Right Sidebar: Real-time Evaluation & Score */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem' }}>Performance Score</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color, #2563eb)' }}>
                  {sessionScore}
                </span>
                <span style={{ color: '#64748b', fontSize: '1rem' }}>/ 100</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 0' }}>
                Calculated in real time based on clarity, technical specificity, and STAR methodology.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem' }}>⚡ Real-Time DB State</h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                <li>Session saved to disk</li>
                <li>Live SSE events active</li>
                <li>Transcripts available for review</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem' }}>💡 Quick Tips</h4>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                <li>Mention metrics & quantifiable results.</li>
                <li>Explain your reasoning & architectural trade-offs.</li>
                <li>Structure answers: Situation, Task, Action, Result.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
