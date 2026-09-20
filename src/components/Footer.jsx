import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Top Grid: Brand & Developer Spotlight */}
        <div className="footer-grid">
          {/* Column 1: Platform Brand */}
          <div className="footer-col brand-col">
            <div className="footer-logo">
              <span className="logo-badge">⚡</span>
              <span className="logo-text">HireSphere <strong>AI</strong></span>
            </div>
            <p className="footer-tagline">
              Autonomous Real-Time Talent &amp; Placement Platform powered by Google Gemini multi-agent AI and zero-latency persistent architecture.
            </p>
            <div className="footer-status">
              <span className="status-indicator-dot"></span>
              <span>All Systems Operational &bull; Cloud Connected</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><Link to="/jobs">Explore Jobs</Link></li>
              <li><Link to="/ai-interview">AI Mock Interview</Link></li>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li>
                <a href="https://hiresphereai.onrender.com/swagger-ui.html" target="_blank" rel="noreferrer">
                  OpenAPI Docs ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Developer & Creator Showcase */}
          <div className="footer-col developer-col">
            <h4>Engineered &amp; Built By</h4>
            <div className="developer-profile-card">
              <div className="developer-header">
                <div className="developer-avatar-mini">AS</div>
                <div>
                  <div className="developer-name">Anas Siddiqui</div>
                  <div className="developer-role">Full-Stack &amp; AI Systems Engineer</div>
                </div>
              </div>

              <p className="developer-bio">
                Designed &amp; built HireSphere AI end-to-end. Open for technical opportunities, collaborations, and engineering roles.
              </p>

              {/* Developer Socials & Contact */}
              <div className="developer-links">
                <a
                  href="https://www.linkedin.com/in/anas-siddiqui-b46a23209"
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn linkedin-btn"
                  title="Connect on LinkedIn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.96 0 1.74-.78 1.74-1.74a1.74 1.74 0 0 0-1.74-1.74c-.96 0-1.74.78-1.74 1.74 0 .96.78 1.74 1.74 1.74m1.4 9.74v-8.37H5.06v8.37h2.8Z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                <a
                  href="https://github.com/anas-byte-dev"
                  target="_blank"
                  rel="noreferrer"
                  className="social-btn github-btn"
                  title="View GitHub Profile"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
                  </svg>
                  <span>GitHub</span>
                </a>

                <a
                  href="mailto:anassidd7256@gmail.com"
                  className="social-btn email-btn"
                  title="Send an email to Anas Siddiqui"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>Hire / Email</span>
                </a>
              </div>

              <div className="developer-email-tag">
                <span>Direct Contact:</span>
                <a href="mailto:anassidd7256@gmail.com" className="email-link">anassidd7256@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider"></div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="footer-bottom">
          <p className="copyright-line">
            &copy; {currentYear} <strong>HireSphere AI</strong> &mdash; Designed, Architected &amp; Engineered by{' '}
            <a
              href="https://www.linkedin.com/in/anas-siddiqui-b46a23209"
              target="_blank"
              rel="noreferrer"
              className="creator-name-highlight"
            >
              Anas Siddiqui
            </a>
            . All rights reserved.
          </p>
          <p className="footer-subtext">
            Empowering candidates and recruiters with persistent real-time intelligence, autonomous multi-agent AI, and enterprise cloud velocity.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
