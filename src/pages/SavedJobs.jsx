import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const SavedJobs = () => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.id) {
      loadSavedJobs();
    }
  }, [user]);

  const loadSavedJobs = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/saved-jobs/candidate/${user.id}`);
      setSavedJobs(res.data || []);
    } catch (err) {
      console.error('Failed to load saved jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedJobId) => {
    setRemovingId(savedJobId);
    setMessage({ type: '', text: '' });
    try {
      await axiosClient.delete(`/saved-jobs/${savedJobId}?candidateId=${user.id}`);
      setMessage({ type: 'success', text: 'Job removed from your saved bookmarks.' });
      setSavedJobs((prev) => prev.filter((sj) => sj.id !== savedJobId));
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || 'Failed to remove saved job.';
      setMessage({ type: 'danger', text: errText });
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuickApply = async (jobId) => {
    setApplyingId(jobId);
    setMessage({ type: '', text: '' });
    try {
      await axiosClient.post(`/jobs/${jobId}/apply?candidateId=${user.id}`, {
        candidateId: user.id,
        jobId: Number(jobId),
      });
      setMessage({ type: 'success', text: '🎉 Application submitted successfully from saved jobs!' });
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || 'Failed to submit application.';
      setMessage({ type: 'danger', text: errText });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="section-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Bookmarked & Saved Positions</h1>
          <p className="subtitle">Easily reference and apply to positions you've saved.</p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading bookmarked jobs...</p>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="empty-card">
          <h3>No bookmarked positions</h3>
          <p>You have not saved any jobs yet. Browse available jobs and bookmark opportunities of interest.</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Explore Job Openings &rarr;
          </Link>
        </div>
      ) : (
        <div className="jobs-list">
          {savedJobs.map((item) => (
            <div key={item.id} className="job-list-card">
              <div className="job-list-main">
                <h3>
                  <Link to={`/jobs/${item.jobId}`} className="text-link">
                    {item.jobTitle}
                  </Link>
                </h3>
                <p className="job-company" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  🏢 {item.companyName}
                </p>
                <div className="job-meta">
                  <span>📍 {item.location}</span>
                  {item.salary && <span>💰 {item.salary}</span>}
                  <span>📅 Saved: {item.savedDate || 'Recently'}</span>
                </div>
              </div>
              <div className="job-list-action" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to={`/jobs/${item.jobId}`} className="btn btn-outline btn-sm">
                  View Details &rarr;
                </Link>
                <button
                  onClick={() => handleQuickApply(item.jobId)}
                  className="btn btn-primary btn-sm"
                  disabled={applyingId === item.jobId}
                >
                  {applyingId === item.jobId ? (
                    <>
                      <span className="btn-spinner"></span> Applying...
                    </>
                  ) : (
                    '🚀 Quick Apply'
                  )}
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="btn btn-outline-danger btn-sm"
                  disabled={removingId === item.id}
                >
                  {removingId === item.id ? (
                    <>
                      <span className="btn-spinner"></span>
                    </>
                  ) : (
                    '🗑️ Remove'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
