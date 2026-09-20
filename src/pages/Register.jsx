import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CANDIDATE',
  });
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
      await register(formData);
      // Supabase sends a confirmation link to the user's email
      navigate('/login', {
        state: {
          verificationSent: true,
          email: formData.email,
        },
      });
    } catch (err) {
      const serverMsg = err.message || err.response?.data?.message || err.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else {
        setError('Registration failed. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Join HireSphere AI</h2>
        <p className="auth-subtitle">Create your free account to access real-time job matching and AI coaching.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name or Organization</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              placeholder="e.g. Jane Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="e.g. jane@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min. 4 characters)</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={4}
            />
          </div>

          <div className="form-group">
            <label>I want to join as:</label>
            <div className="role-selector">
              <label className={`role-option ${formData.role === 'CANDIDATE' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="CANDIDATE"
                  checked={formData.role === 'CANDIDATE'}
                  onChange={handleChange}
                />
                <span className="role-title">👨‍💻 Candidate</span>
                <span className="role-desc">Looking for job opportunities</span>
              </label>

              <label className={`role-option ${formData.role === 'RECRUITER' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="RECRUITER"
                  checked={formData.role === 'RECRUITER'}
                  onChange={handleChange}
                />
                <span className="role-title">🏢 Recruiter</span>
                <span className="role-desc">Posting jobs & hiring talent</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
