import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, role, logout } = useAuth();
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
          <span className="logo-icon" style={{ filter: 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.45))' }}>🌐</span>
          <span className="logo-text" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
            HireSphere <span style={{ fontSize: '0.75em', padding: '0.1rem 0.35rem', background: 'var(--primary, #7c3aed)', color: '#fff', borderRadius: '4px', WebkitTextFillColor: '#fff', verticalAlign: 'middle' }}>AI</span>
          </span>
        </Link>

        <nav className="navbar-links">
          <NavLink to="/" className={getNavLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/jobs" className={getNavLinkClass}>
            Browse Jobs
          </NavLink>
          <NavLink to="/ai-coach" className={getNavLinkClass} style={{ color: 'var(--primary, #7c3aed)', fontWeight: 600 }}>
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
