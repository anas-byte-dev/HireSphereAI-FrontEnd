import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading application...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="section-container">
        <div className="empty-card" style={{ maxWidth: '600px', margin: '3rem auto' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>⛔ 403 - Unauthorized Access</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Your account role (<strong>{user.role}</strong>) is not permitted to view this page. This area requires{' '}
            <strong>{allowedRoles.join(' or ')}</strong> privileges.
          </p>
          <Link
            to={
              user.role === 'CANDIDATE'
                ? '/dashboard/candidate'
                : user.role === 'RECRUITER'
                ? '/dashboard/recruiter'
                : '/dashboard/admin'
            }
            className="btn btn-primary"
          >
            Return to Your Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
