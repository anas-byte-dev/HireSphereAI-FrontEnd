import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

const Home = () => {
  const { user, role } = useAuth();
  const { isConnected } = useRealtime();
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('anassidd7256@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axiosClient.get('/jobs');
        setFeaturedJobs(res.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load featured jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  return (
    <div className="home-page animate-fade-in">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡ Next-Gen Autonomous AI & Real-Time Sync</span>
            <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: isConnected ? '#16a34a' : '#ef4444', color: '#fff' }}>
              {isConnected ? 'Real-Time DB Active' : 'Connecting...'}
            </span>
          </div>
          <h1>
            Transform Your Placement Journey with <span className="hero-highlight">HireSphere AI</span>
          </h1>
          <p>
            The real-time, autonomous recruitment ecosystem. Match skills dynamically, practice with the turn-by-turn AI Mock Interview Coach, and track your applications with instant live synchronization.
          </p>
          <div className="hero-actions">
            <Link to="/jobs" className="btn btn-primary btn-lg">
              Explore Open Positions &rarr;
            </Link>
            <Link to="/ai-coach" className="btn btn-outline btn-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
              🤖 Try AI Interview Coach
            </Link>
            {!user ? (
              <Link to="/register" className="btn btn-outline btn-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}>
                Create Free Account
              </Link>
            ) : (
              <Link
                to={
                  role === 'CANDIDATE'
                    ? '/dashboard/candidate'
                    : role === 'RECRUITER'
                    ? '/dashboard/recruiter'
                    : '/dashboard/admin'
                }
                className="btn btn-outline btn-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
              >
                Go to Dashboard &rarr;
              </Link>
            )}
          </div>

          <div className="hero-stats-ribbon">
            <div className="hero-stat-item">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Real-Time Persistent</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value">Gemini</span>
              <span className="hero-stat-label">Agentic AI Powered</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value">0s</span>
              <span className="hero-stat-label">Live Event Latency</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-value">Free</span>
              <span className="hero-stat-label">Zero-Setup Stack</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2>Latest Open Positions</h2>
            <p className="subtitle">Real-time job listings updated live from the database</p>
          </div>
          <Link to="/jobs" className="btn btn-outline btn-sm">
            View all jobs &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Fetching opportunities from real-time database...</p>
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="empty-card">
            <h3>No Jobs Currently Posted</h3>
            <p>New roles will appear automatically as recruiters post them in real time.</p>
            <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Browse Job Catalog
            </Link>
          </div>
        ) : (
          <div className="jobs-grid">
            {featuredJobs.map((job, idx) => (
              <div key={job.id} className={`job-card animate-fade-in stagger-${(idx % 3) + 1}`}>
                <div className="job-card-header">
                  <h3>{job.title}</h3>
                  <span className="badge badge-primary">{job.employmentType || 'FULL_TIME'}</span>
                </div>
                <p className="job-company" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  🏢 {job.company || 'Enterprise Company'}
                </p>
                <div className="job-meta">
                  <span>📍 {job.location}</span>
                  {job.salaryRange && <span>💰 {job.salaryRange}</span>}
                </div>
                <p className="job-snippet">{job.description ? job.description.slice(0, 110) + '...' : 'Exciting career opportunity at an innovative organization.'}</p>
                <div className="job-card-footer">
                  <Link to={`/jobs/${job.id}`} className="btn btn-outline btn-sm">
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="features-section">
        <div className="section-container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2rem' }}>
            <h2>Autonomous Intelligence & Real-Time Velocity</h2>
            <p className="subtitle">Engineered to eliminate friction, automate screening, and prepare candidates for real interviews.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card animate-fade-in stagger-1">
              <span className="feature-icon">🤖</span>
              <h3>Agentic AI Interview Coach</h3>
              <p>Practice role-specific mock interviews with an adaptive AI agent, getting instant feedback tips and performance scoring.</p>
            </div>
            <div className="feature-card animate-fade-in stagger-2">
              <span className="feature-icon">⚡</span>
              <h3>Persistent Real-Time Database</h3>
              <p>All job postings, applications, interview logs, and candidate profiles are stored persistently with live Server-Sent Event updates.</p>
            </div>
            <div className="feature-card animate-fade-in stagger-3">
              <span className="feature-icon">🎯</span>
              <h3>Autonomous Screening</h3>
              <p>Gemini-powered semantic fit analysis highlights exact strengths, skill gaps, and custom technical interview questions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering & Creator Showcase */}
      <section className="developer-spotlight-section">
        <div className="section-container">
          <div className="developer-spotlight-card animate-fade-in">
            {/* Left: Avatar & Live Status */}
            <div className="developer-spotlight-avatar-col">
              <div className="developer-spotlight-avatar">
                <span className="avatar-initials">AS</span>
                <span className="avatar-pulse-ring"></span>
              </div>
              <div className="developer-status-pill">
                <span className="pulsing-green-dot"></span>
                <span>Open to Opportunities</span>
              </div>
            </div>

            {/* Middle: Bio & Engineering Stack */}
            <div className="developer-spotlight-info-col">
              <div className="spotlight-eyebrow">
                <span>ENGINEERED &amp; ARCHITECTED BY</span>
              </div>
              <h2 className="spotlight-name">Anas Siddiqui</h2>
              <p className="spotlight-tagline">
                Creator &bull; Full-Stack &amp; Autonomous AI Systems Engineer
              </p>
              <p className="spotlight-desc">
                Architected and engineered HireSphere AI end-to-end &mdash; unifying Spring Boot 3 microservices, an embedded zero-latency persistent H2 DBMS, real-time Server-Sent Events (SSE), and Google Gemini multi-agent autonomous intelligence into a production-grade recruitment ecosystem.
              </p>

              <div className="spotlight-skills">
                <span className="tech-badge">Java 17 &bull; Spring Boot 3</span>
                <span className="tech-badge">React 19 &bull; Vite</span>
                <span className="tech-badge">Google Gemini AI</span>
                <span className="tech-badge">Embedded DBMS Engine</span>
                <span className="tech-badge">Server-Sent Events (SSE)</span>
                <span className="tech-badge">Docker &bull; Render &bull; Vercel</span>
              </div>
            </div>

            {/* Right: Contact & Hire Action Hub */}
            <div className="developer-spotlight-action-col">
              <div className="action-hub-header">
                <h4>Contact Developer</h4>
                <p>Connect for engineering roles, technical inquiries, or collaborations.</p>
              </div>

              <div className="action-hub-buttons">
                <a
                  href="https://www.linkedin.com/in/anas-siddiqui-b46a23209"
                  target="_blank"
                  rel="noreferrer"
                  className="spotlight-btn btn-linkedin"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.96 0 1.74-.78 1.74-1.74a1.74 1.74 0 0 0-1.74-1.74c-.96 0-1.74.78-1.74 1.74 0 .96.78 1.74 1.74 1.74m1.4 9.74v-8.37H5.06v8.37h2.8Z" />
                  </svg>
                  <span>Connect on LinkedIn</span>
                </a>

                <a
                  href="https://github.com/anas-byte-dev"
                  target="_blank"
                  rel="noreferrer"
                  className="spotlight-btn btn-github"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                  </svg>
                  <span>GitHub Repository &amp; Profile</span>
                </a>

                <a
                  href="mailto:anassidd7256@gmail.com"
                  className="spotlight-btn btn-email"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Send Email &bull; Hire Me</span>
                </a>
              </div>

              <div className="email-copy-box">
                <span className="email-display">anassidd7256@gmail.com</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="btn-copy-email"
                  title="Copy email to clipboard"
                >
                  {copiedEmail ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
