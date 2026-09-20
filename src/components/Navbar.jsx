import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const { isConnected } = useRealtime();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon" style={{ filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.4))' }}>🌐</span>
          <span className="logo-text" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
            HireSphere <span style={{ fontSize: '0.75em', padding: '0.1rem 0.35rem', background: '#2563eb', color: '#fff', borderRadius: '4px', WebkitTextFillColor: '#fff', verticalAlign: 'middle' }}>AI</span>
          </span>
        </Link>

        {/* Real-time DB Status Badge */}
        <div
          title={isConnected ? 'Connected to persistent real-time database stream' : 'Reconnecting to database stream...'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: isConnected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: isConnected ? '#16a34a' : '#dc2626',
            border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            marginLeft: '0.5rem',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
          <span>{isConnected ? 'Real-Time DB' : 'Connecting...'}</span>
        </div>

        <nav className="navbar-links">
          <NavLink to="/" className={getNavLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/jobs" className={getNavLinkClass}>
            Browse Jobs
          </NavLink>
          <NavLink to="/ai-coach" className={getNavLinkClass} style={{ color: '#2563eb', fontWeight: 600 }}>
            🤖 AI Coach
          </NavLink>

          {user && role === 'CANDIDATE' && (
            <>
              <NavLink to="/dashboard/candidate" className={getNavLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/applications" className={getNavLinkClass}>
                Applications
              </NavLink>
              <NavLink to="/saved-jobs" className={getNavLinkClass}>
                Saved Jobs
              </NavLink>
              <NavLink to="/interviews" className={getNavLinkClass}>
                Interviews
              </NavLink>
              <NavLink to="/profile" className={getNavLinkClass}>
                Profile
              </NavLink>
            </>
          )}

          {user && role === 'RECRUITER' && (
            <>
              <NavLink to="/dashboard/recruiter" className={getNavLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/applications" className={getNavLinkClass}>
                Applicants
              </NavLink>
              <NavLink to="/interviews" className={getNavLinkClass}>
                Interviews
              </NavLink>
              <NavLink to="/profile" className={getNavLinkClass}>
                Company Profile
              </NavLink>
            </>
          )}

          {user && role === 'ADMIN' && (
            <NavLink to="/dashboard/admin" className={getNavLinkClass}>
              Admin Dashboard
            </NavLink>
          )}

          {user && (
            <NavLink to="/notifications" className={getNavLinkClass}>
              Notifications
            </NavLink>
          )}
        </nav>

        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <span className={`user-badge user-badge-${(role || '').toLowerCase()}`}>
                <span className="user-name">{user.name || user.email}</span>
                <span className="role-tag">{role}</span>
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
