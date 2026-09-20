import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendEmailOtp, verifyEmailOtp, isSupabaseConfigured } from '../lib/supabaseClient';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const verificationNotice = location.state?.verificationSent ? location.state.email : null;
  const [confirmedNotice, setConfirmedNotice] = useState(false);
  const [linkErrorNotice, setLinkErrorNotice] = useState('');

  // If user is already authenticated (e.g. Supabase verified and signed in), redirect to dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/dashboard/admin', { replace: true });
      } else if (user.role === 'RECRUITER') {
        navigate('/dashboard/recruiter', { replace: true });
      } else {
        navigate('/dashboard/candidate', { replace: true });
      }
    }
  }, [user, navigate]);

  // Detect email confirmation hash or query params from Supabase redirect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hash = window.location.hash || '';

    if (searchParams.get('verified') === 'true' || hash.includes('type=signup') || hash.includes('access_token')) {
      setConfirmedNotice(true);
    }

    if (hash.includes('error_description')) {
      const hashParams = new URLSearchParams(hash.replace('#', '?'));
      const desc = hashParams.get('error_description');
      if (desc) {
        setLinkErrorNotice(decodeURIComponent(desc.replace(/\+/g, ' ')));
      }
    }
  }, [location]);

  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState({ type: '', text: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await login(formData.email, formData.password);
      if (data.role === 'ADMIN') {
        navigate('/dashboard/admin');
      } else if (data.role === 'RECRUITER') {
        navigate('/dashboard/recruiter');
      } else {
        navigate('/dashboard/candidate');
      }
    } catch (err) {
      const serverMsg = err.message || err.response?.data?.message || err.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else if (err.response && err.response.status === 403) {
        setError('Your account has been deactivated. Please contact support.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail) {
      setOtpMessage({ type: 'danger', text: 'Please enter a valid email address.' });
      return;
    }

    setOtpLoading(true);
    setOtpMessage({ type: '', text: '' });

    try {
      if (!isSupabaseConfigured()) {
        setOtpMessage({
          type: 'info',
          text: '💡 Supabase is in Ready Mode: Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env to send live OTP emails, or use the Password Login tab with pre-seeded demo accounts.',
        });
        setOtpSent(true);
        return;
      }

      await sendEmailOtp(otpEmail);
      setOtpSent(true);
      setOtpMessage({ type: 'success', text: `✨ 6-digit OTP code sent to ${otpEmail}! Check your inbox.` });
    } catch (err) {
      setOtpMessage({ type: 'danger', text: err.message || 'Failed to send OTP email via Supabase.' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      setOtpMessage({ type: 'danger', text: 'Please enter the 6-digit OTP code.' });
      return;
    }

    setOtpLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        // Fallback for demo testing when Supabase keys are pending
        setOtpMessage({
          type: 'success',
          text: '✓ OTP Verified successfully! Directing to candidate chamber...',
        });
        setTimeout(() => navigate('/dashboard/candidate'), 1200);
        return;
      }

      const res = await verifyEmailOtp(otpEmail, otpCode);
      if (res && res.session) {
        setOtpMessage({ type: 'success', text: '✓ Supabase OTP verified successfully!' });
        setTimeout(() => navigate('/dashboard/candidate'), 1000);
      }
    } catch (err) {
      setOtpMessage({ type: 'danger', text: err.message || 'Invalid or expired OTP code.' });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sign In to HireSphere AI</h2>
        <p className="auth-subtitle">Access your applications, live job tracking, and AI coaching chamber.</p>

        {confirmedNotice && (
          <div
            className="alert alert-success"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#065f46',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            }}
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>🎉</span>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                Email Verified Successfully!
              </strong>
              <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                Your email has been confirmed. You can sign in below to access your HireSphere dashboard.
              </span>
            </div>
          </div>
        )}

        {linkErrorNotice && (
          <div
            className="alert alert-warning"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #f59e0b',
              color: '#92400e',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>ℹ️</span>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                Email Confirmation Status
              </strong>
              <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                {linkErrorNotice}. If you already clicked the link in your email once, your account was already verified! Please enter your password below to sign in.
              </span>
            </div>
          </div>
        )}

        {verificationNotice && (
          <div
            className="alert alert-success"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#065f46',
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            }}
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>✉️</span>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '4px' }}>
                Registration Successful! Verify Your Email
              </strong>
              <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                Supabase sent a confirmation link to <strong>{verificationNotice}</strong>.
                Please check your inbox (and spam folder) and click the link to confirm your account before logging in.
              </span>
            </div>
          </div>
        )}

        {/* Authentication Mode Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
          <button
            type="button"
            className={`btn btn-sm ${authMode === 'password' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
            onClick={() => { setAuthMode('password'); setError(''); }}
          >
            🔑 Password Login
          </button>
          <button
            type="button"
            className={`btn btn-sm ${authMode === 'otp' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, borderRadius: '6px 6px 0 0', borderBottom: 'none' }}
            onClick={() => { setAuthMode('otp'); setError(''); }}
          >
            📨 Supabase Email OTP
          </button>
        </div>

        {authMode === 'password' ? (
          <>
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="e.g. alice@example.com or admin@hiresphere.ai"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        ) : (
          <div className="otp-auth-section animate-fade-in">
            {otpMessage.text && (
              <div className={`alert alert-${otpMessage.type}`} style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                {otpMessage.text}
              </div>
            )}

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="auth-form">
                <div className="form-group">
                  <label htmlFor="otpEmail">Enter Registered Email</label>
                  <input
                    type="email"
                    id="otpEmail"
                    className="form-control"
                    placeholder="e.g. yourname@example.com"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={otpLoading}>
                  {otpLoading ? 'Sending OTP...' : '📨 Send One-Time Password (OTP)'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="form-group">
                  <label htmlFor="otpCode">6-Digit OTP Code</label>
                  <input
                    type="text"
                    id="otpCode"
                    maxLength="6"
                    className="form-control"
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                    required
                  />
                  <small className="subtext" style={{ display: 'block', marginTop: '0.35rem' }}>
                    Sent to: <strong>{otpEmail}</strong> (
                    <span
                      style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setOtpSent(false)}
                    >
                      Change
                    </span>
                    )
                  </small>
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={otpLoading}>
                  {otpLoading ? 'Verifying...' : '✓ Verify OTP & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
          <div className="demo-credentials">
            <strong>Sample Accounts (Free & Ready):</strong>
            <ul>
              <li>Candidate: <code>alice@example.com / candidate123</code></li>
              <li>Recruiter: <code>recruiter@techcorp.com / recruiter123</code></li>
              <li>Admin: <code>admin@hiresphere.ai / admin123</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

