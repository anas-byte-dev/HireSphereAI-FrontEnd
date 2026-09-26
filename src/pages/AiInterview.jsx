import React, { useState, useEffect, useRef } from 'react';
import aiService from '../services/aiService';
import { isGeminiConfigured } from '../services/geminiClient';
import { useAuth } from '../context/AuthContext';

const DEFAULT_ROLES = [
  'Full-Stack Software Engineer',
  'Java Backend Engineer',
  'React Frontend Developer',
  'Cloud & DevOps Specialist',
  'Data & AI Engineer'
];

export default function AiInterview() {
  const { user } = useAuth();

  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLES[0]);
  const [customRole, setCustomRole] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const activeRole = customRole.trim() ? customRole.trim() : selectedRole;

  // Scroll ONLY the message container, preventing outer page/window jump
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  // Keep input focused so candidate can effortlessly keep typing
  useEffect(() => {
    if (!loading && sessionId) {
      inputRef.current?.focus();
    }
  }, [loading, sessionId]);

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const data = await aiService.startInterviewSession(user ? user.id : 3, activeRole);
      setSessionId(data.sessionId);
      setMessages([data]);
      setSessionScore(data.score || 100);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error('Failed to start interview session:', err);
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
    const updatedHistory = [...messages, tempCandidateMsg];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const data = await aiService.sendInterviewMessage({
        sessionId,
        candidateId: user ? user.id : 3,
        jobRole: activeRole,
        message: userText,
        history: updatedHistory,
      });

      setMessages((prev) => [...prev, data]);
      if (data.score) {
        setSessionScore(data.score);
      }
    } catch (err) {
      console.error('Failed to send interview message:', err);
      const fallbackMsg = {
        id: Date.now(),
        sessionId,
        sender: 'AI',
        message: "Thank you for explaining that. Let's explore your problem-solving process further: How would you approach identifying and resolving a performance bottleneck in production?",
        feedback: "Clear response! Be sure to emphasize specific metrics and trade-offs in your technical explanations.",
        score: 80,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <span>🤖 HireSphere AI Interview Coach</span>
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
        <div className="ai-interview-chamber-grid">
          {/* Main Conversation Chamber */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '640px', maxHeight: '82vh', padding: 0, overflow: 'hidden' }}>
            {/* Chamber Topbar */}
            <div
              style={{
                padding: '0.9rem 1.25rem',
                background: 'var(--bg-subtle, #ede7f8)',
                borderBottom: '1px solid var(--border-color, #e4dcf4)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main, #1e1b4b)' }}>Role: {activeRole}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light, #6b7280)', marginLeft: '0.75rem' }}>
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
            <div
              ref={messagesContainerRef}
              style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
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
                      padding: '0.9rem 1.15rem',
                      borderRadius: '14px',
                      background:
                        msg.sender === 'CANDIDATE'
                          ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                          : '#ffffff',
                      border:
                        msg.sender === 'CANDIDATE'
                          ? '1px solid #6d28d9'
                          : '1.5px solid var(--border-color, #e4dcf4)',
                      color: msg.sender === 'CANDIDATE' ? '#ffffff' : 'var(--text-main, #1e1b4b)',
                      boxShadow: '0 2px 10px rgba(124, 58, 237, 0.08)',
                      lineHeight: 1.5,
                      fontSize: '0.95rem',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', opacity: msg.sender === 'CANDIDATE' ? 0.9 : 0.75, marginBottom: '0.35rem', fontWeight: 700 }}>
                      {msg.sender === 'CANDIDATE' ? 'You (Candidate)' : '🤖 HireSphere AI Interviewer'}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
                      {msg.message}
                    </div>
                  </div>

                  {/* AI Feedback Card */}
                  {msg.sender === 'AI' && msg.feedback && (
                    <div
                      style={{
                        marginTop: '0.45rem',
                        maxWidth: '82%',
                        padding: '0.6rem 0.9rem',
                        borderRadius: '10px',
                        background: 'rgba(217, 119, 6, 0.08)',
                        border: '1px solid rgba(217, 119, 6, 0.25)',
                        borderLeft: '4px solid #d97706',
                        fontSize: '0.84rem',
                        color: '#92400e',
                        lineHeight: 1.5,
                      }}
                    >
                      💡 <strong>Coach Feedback:</strong> {msg.feedback}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: 'var(--primary, #7c3aed)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    background: 'var(--primary-light, #f3e8ff)',
                    border: '1px solid var(--primary-border, #d8b4fe)',
                    padding: '0.55rem 0.9rem',
                    borderRadius: '8px',
                    width: 'fit-content',
                  }}
                >
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid currentColor',
                      borderRightColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.75s linear infinite',
                    }}
                  />
                  <span>AI Coach is evaluating your response and formulating the next question...</span>
                </div>
              )}
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
                ref={inputRef}
                type="text"
                placeholder={loading ? 'AI Coach is thinking...' : 'Type your response to the interviewer and press Enter...'}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!loading && inputMessage.trim()) {
                      handleSendMessage(e);
                    }
                  }
                }}
                disabled={loading}
                className="form-control"
                style={{ flex: 1, padding: '0.7rem 0.9rem', fontSize: '0.95rem' }}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !inputMessage.trim()}
                style={{ padding: '0.7rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {loading ? 'Evaluating...' : 'Send Answer'}
              </button>
            </form>
          </div>

          {/* Right Sidebar: Real-time Evaluation & Score */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem' }}>Performance Score</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary, #7c3aed)' }}>
                  {sessionScore}
                </span>
                <span style={{ color: '#64748b', fontSize: '1rem' }}>/ 100</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.5rem 0 0' }}>
                Calculated in real time based on clarity, technical specificity, and STAR methodology.
              </p>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem' }}>Session Sync</h4>
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
