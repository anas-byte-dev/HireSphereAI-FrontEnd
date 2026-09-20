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
    </div>
  );
};

export default Home;
