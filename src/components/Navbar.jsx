import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getNavLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
          <span className="logo-icon" style={{ filter: 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.45))' }}>🌐</span>
          <span className="logo-text" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
            HireSphere <span style={{ fontSize: '0.75em', padding: '0.1rem 0.35rem', background: 'var(--primary, #7c3aed)', color: '#fff', borderRadius: '4px', WebkitTextFillColor: '#fff', verticalAlign: 'middle' }}>AI</span>
          </span>
        </Link>

        {/* Hamburger 3-line Button for Mobile / Tablet */}
        <button
          type="button"
          className={`navbar-hamburger ${mobileMenuOpen ? 'is-active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Collapsible Nav Links & Auth Menu */}
        <div className={`navbar-collapse ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="navbar-links">
            <NavLink to="/" className={getNavLinkClass} end onClick={() => setMobileMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/jobs" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
              Browse Jobs
            </NavLink>
            <NavLink to="/ai-coach" className={getNavLinkClass} style={{ color: 'var(--primary, #7c3aed)', fontWeight: 600 }} onClick={() => setMobileMenuOpen(false)}>
              🤖 AI Coach
            </NavLink>

            {user && role === 'CANDIDATE' && (
              <>
                <NavLink to="/dashboard/candidate" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/applications" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Applications
                </NavLink>
                <NavLink to="/saved-jobs" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Saved Jobs
                </NavLink>
                <NavLink to="/interviews" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Interviews
                </NavLink>
                <NavLink to="/profile" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </NavLink>
              </>
            )}

            {user && role === 'RECRUITER' && (
              <>
                <NavLink to="/dashboard/recruiter" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/applications" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Applicants
                </NavLink>
                <NavLink to="/interviews" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Interviews
                </NavLink>
                <NavLink to="/profile" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                  Company Profile
                </NavLink>
              </>
            )}

            {user && role === 'ADMIN' && (
              <NavLink to="/dashboard/admin" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
                Admin Dashboard
              </NavLink>
            )}

            {user && (
              <NavLink to="/notifications" className={getNavLinkClass} onClick={() => setMobileMenuOpen(false)}>
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
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
