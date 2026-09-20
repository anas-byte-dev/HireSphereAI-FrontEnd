import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import SkillMatchWidget from '../components/SkillMatchWidget';

const JobDetails = () => {
  const { id } = useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [hasApplied, setHasApplied] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [skillMatch, setSkillMatch] = useState(null);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    if (user && role === 'CANDIDATE') {
      checkCandidateStatus();
    }
  }, [id, user]);

  const fetchJobDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      setError('Job posting not found or has been removed.');
    } finally {
      setLoading(false);
    }
  };

  const checkCandidateStatus = async () => {
    try {
      // Check existing applications
      const appsRes = await axiosClient.get(`/applications/candidate/${user.id}`);
      const apps = appsRes.data || [];
      const applied = apps.some((a) => a.jobId === Number(id));
      setHasApplied(applied);

      // Check saved jobs
      const savedRes = await axiosClient.get(`/saved-jobs/candidate/${user.id}`);
      const saved = savedRes.data || [];
      const isSaved = saved.some((s) => s.jobId === Number(id));
      setHasSaved(isSaved);

      // Check real-time skill match percentage
      const matchRes = await axiosClient.get(`/skill-match?candidateId=${user.id}&jobId=${id}`);
      setSkillMatch(matchRes.data);
    } catch (err) {
      console.warn('Candidate status check note:', err.message);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (role !== 'CANDIDATE') {
      setActionMessage({ type: 'danger', text: 'Only candidates can apply for jobs.' });
      return;
    }

    // Check 70% skill match gate
    if (skillMatch && skillMatch.requiredJobSkills?.length > 0) {
      if (skillMatch.matchPercentage < 70) {
        const missing = skillMatch.missingSkills?.join(', ') || 'required skills';
        setActionMessage({
          type: 'danger',
          text: `⚠️ Skill Match: ${skillMatch.matchPercentage}% (Minimum 70% required to apply). Missing: ${missing}. Please update your profile skills or choose a matching role.`
        });
        return;
      }
    }

    setApplying(true);
    setActionMessage({ type: '', text: '' });
    
    try {
      await axiosClient.post(`/jobs/${id}/apply?candidateId=${user.id}`, {
        candidateId: user.id,
        jobId: Number(id),
      });
      setActionMessage({ type: 'success', text: '🎉 Application submitted successfully! The recruiter has been notified in real time.' });
      setHasApplied(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to submit application.';
      setActionMessage({ type: 'danger', text: msg });
    } finally {
      setApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (role !== 'CANDIDATE') {
      setActionMessage({ type: 'danger', text: 'Only candidates can bookmark jobs.' });
      return;
    }

    setSaving(true);
    setActionMessage({ type: '', text: '' });
    try {
      await axiosClient.post('/saved-jobs', {
        candidateId: user.id,
        jobId: Number(id),
      });
      setActionMessage({ type: 'success', text: 'Job saved to your bookmarks!' });
      setHasSaved(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save job.';
      setActionMessage({ type: 'danger', text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="section-container">
        <p className="loading-state">Loading job details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="section-container">
        <div className="empty-card">
          <h2>Job Not Found</h2>
          <p>{error || 'The requested job posting does not exist.'}</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            &larr; Back to All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container animate-fade-in">
      <Link to="/jobs" className="btn-back">
        &larr; Back to Job Listings
      </Link>

      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type}`} style={{ margin: '1rem 0' }}>
          {actionMessage.text}
        </div>
      )}

      <div className="job-details-card">
        <div className="job-details-header">
          <div>
            <h1>{job.title}</h1>
            <h3 className="job-company" style={{ color: 'var(--primary)', marginTop: '0.25rem' }}>
              🏢 {job.companyName}
            </h3>
            <div className="job-meta" style={{ marginTop: '0.65rem' }}>
              <span>📍 {job.location}</span>
              {job.salary && <span>💰 {job.salary}</span>}
              <span className="badge badge-primary">{job.jobType || 'Full-time'}</span>
              <span className={`badge ${job.active ? 'badge-success' : 'badge-danger'}`}>
                {job.active ? 'Active & Open' : 'Closed'}
              </span>
            </div>
          </div>

          <div className="job-actions">
            {role === 'CANDIDATE' && job.active && (
              <>
                <button
                  onClick={handleApply}
                  className={`btn ${hasApplied ? 'btn-outline-success' : 'btn-primary'} btn-lg`}
                  disabled={applying || hasApplied}
                >
                  {applying ? (
                    <>
                      <span className="btn-spinner"></span> Submitting...
                    </>
                  ) : hasApplied ? (
                    '✓ Application Submitted'
                  ) : (
                    '🚀 Apply for Position'
                  )}
                </button>
                <button
                  onClick={handleSaveJob}
                  className={`btn ${hasSaved ? 'btn-outline-success' : 'btn-outline'} btn-lg`}
                  disabled={saving || hasSaved}
                >
                  {saving ? (
                    <>
                      <span className="btn-spinner"></span> Saving...
                    </>
                  ) : hasSaved ? (
                    '★ Saved to Bookmarks'
                  ) : (
                    '☆ Bookmark Position'
                  )}
                </button>
              </>
            )}

            {!user && (
              <Link to="/login" className="btn btn-primary btn-lg">
                🔑 Sign in to Apply
              </Link>
            )}
          </div>
        </div>

        {/* Live Skill-Match Calculation for Candidates */}
        {role === 'CANDIDATE' && user?.id && (
          <div style={{ marginTop: '1.5rem' }}>
            <SkillMatchWidget candidateId={user.id} jobId={job.id} />
          </div>
        )}

        <hr className="divider" />

        <div className="job-section">
          <h3>Job Description</h3>
          <p className="job-description-text">{job.description || 'No description provided.'}</p>
        </div>

        {job.requirements && (
  <div className="job-section">
    <h3>Required Skills & Qualifications</h3>

    <div className="skills-tags">
      {(Array.isArray(job.requirements)
        ? job.requirements
        : String(job.requirements).split(',')
      ).map((req, idx) => (
        <span key={idx} className="skill-tag">
          {req.trim()}
        </span>
      ))}
    </div>
  </div>
)}

        <div className="job-section">
          <h3>Position Details</h3>
          <div className="job-overview-grid">
            <div className="overview-item">
              <span className="overview-label">Job Reference:</span>
              <span className="overview-val">#{job.id}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Date Posted:</span>
              <span className="overview-val">{job.postedDate || 'Recently'}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Employment Type:</span>
              <span className="overview-val">{job.jobType || 'Full-time'}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Work Location:</span>
              <span className="overview-val">{job.location}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Compensation:</span>
              <span className="overview-val">{job.salary || 'Competitive'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
