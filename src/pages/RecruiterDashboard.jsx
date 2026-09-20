import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null); // null or job object
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: '',
    jobType: 'Full-time',
    salary: '',
    requirements: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleAiGenerateJob = async () => {
    if (!newJob.title) {
      setMessage({ type: 'danger', text: 'Please enter a Job Title first so AI can draft the details.' });
      return;
    }
    setGeneratingAi(true);
    setMessage({ type: '', text: '' });
    try {
      const skills = newJob.requirements ? newJob.requirements.split(',').map(s => s.trim()).filter(Boolean) : [];
      const res = await axiosClient.post('/ai/generate-job', {
        title: newJob.title,
        experience: '0-2 years',
        location: newJob.location || 'Remote',
        targetSkills: skills,
      });
      if (res.data) {
        setNewJob((prev) => ({
          ...prev,
          description: res.data.description || prev.description,
          salary: res.data.recommendedSalary || prev.salary,
          requirements: Array.isArray(res.data.suggestedSkills)
            ? res.data.suggestedSkills.join(', ')
            : (res.data.requirements || prev.requirements),
        }));
        setMessage({ type: 'success', text: '✨ Job details autonomously drafted by HireSphere AI!' });
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setMessage({ type: 'danger', text: 'Failed to generate job with AI.' });
    } finally {
      setGeneratingAi(false);
    }
  };

  const { addEventListener } = useRealtime();
  const [liveApplicantAlert, setLiveApplicantAlert] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadRecruiterJobs();
    }
  }, [user]);

  // Real-time synchronization for new candidate applications
  useEffect(() => {
    if (!addEventListener) return;
    const unsubscribe = addEventListener('APPLICATION_SUBMITTED', (event) => {
      setLiveApplicantAlert(`🎉 Live Candidate Application: ${event.message || 'A candidate applied to your job listing!'}`);
      setTimeout(() => setLiveApplicantAlert(''), 8000);
      loadRecruiterJobs();
    });
    return () => unsubscribe();
  }, [addEventListener, user]);

  const loadRecruiterJobs = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/jobs/recruiter/${user.id}`);
      const jobList = res.data || [];
      setJobs(jobList);

      // Count total applicants across recruiter's jobs
      let applicantCount = 0;
      await Promise.all(
        jobList.map(async (j) => {
          try {
            const apps = await axiosClient.get(`/applications/job/${j.id}`);
            applicantCount += (apps.data || []).length;
          } catch (e) {
            // ignore individual job errors
          }
        })
      );
      setTotalApplicants(applicantCount);
    } catch (err) {
      console.error('Failed to load recruiter jobs', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const skillsList = newJob.requirements
        ? newJob.requirements.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        jobType: newJob.jobType,
        employmentType: newJob.jobType,
        salary: newJob.salary,
        salaryRange: newJob.salary,
        recruiterId: user.id,
        company: user.name || 'Company',
        companyName: user.name || 'Company',
        requirements: newJob.requirements || '',
        skills: skillsList,
      };

      await axiosClient.post('/jobs', payload);
      setMessage({ type: 'success', text: 'Job position created and published successfully!' });
      setShowPostForm(false);
      setNewJob({
        title: '',
        description: '',
        location: '',
        jobType: 'Full-time',
        salary: '',
        requirements: '',
      });
      loadRecruiterJobs();
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || 'Failed to post job.';
      setMessage({ type: 'danger', text: errText });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditJobClick = (job) => {
    setEditingJob({
      id: job.id,
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      jobType: job.jobType || job.employmentType || 'Full-time',
      salary: job.salary || job.salaryRange || '',
      requirements: typeof job.requirements === 'string'
        ? job.requirements
        : Array.isArray(job.skills)
        ? job.skills.join(', ')
        : '',
    });
    setShowPostForm(false);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const skillsList = editingJob.requirements
        ? editingJob.requirements.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        title: editingJob.title,
        description: editingJob.description,
        location: editingJob.location,
        jobType: editingJob.jobType,
        employmentType: editingJob.jobType,
        salary: editingJob.salary,
        salaryRange: editingJob.salary,
        company: user.name || 'Company',
        companyName: user.name || 'Company',
        requirements: editingJob.requirements || '',
        skills: skillsList,
      };

      await axiosClient.put(`/jobs/${editingJob.id}?recruiterId=${user.id}`, payload);
      setMessage({ type: 'success', text: 'Job posting updated successfully!' });
      setEditingJob(null);
      loadRecruiterJobs();
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || 'Failed to update job.';
      setMessage({ type: 'danger', text: errText });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job listing?')) {
      return;
    }

    setDeletingId(jobId);
    setMessage({ type: '', text: '' });

    try {
      await axiosClient.delete(`/jobs/${jobId}?recruiterId=${user.id}`);
      setMessage({ type: 'success', text: 'Job position deleted successfully.' });
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || 'Failed to delete job.';
      setMessage({ type: 'danger', text: errText });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    try {
      await axiosClient.put(`/jobs/${jobId}/status?recruiterId=${user.id}`, {
        active: !currentStatus,
      });
      setMessage({
        type: 'success',
        text: `Job listing is now ${!currentStatus ? 'Active & Open' : 'Closed'}.`,
      });
      loadRecruiterJobs();
    } catch (err) {
      const errText = err.response?.data?.error || err.response?.data?.message || 'Failed to update job status.';
      setMessage({ type: 'danger', text: errText });
    }
  };

  return (
    <div className="section-container animate-fade-in">
      <div className="dashboard-header-flex">
        <div>
          <h1>Recruiter Control Center</h1>
          <p className="subtitle">Manage job vacancies, company postings, and incoming candidate applications.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setEditingJob(null);
              setShowPostForm(!showPostForm);
            }}
            className="btn btn-primary"
          >
            {showPostForm ? '✕ Close Form' : '+ Post New Position'}
          </button>
        </div>
      </div>

      {liveApplicantAlert && (
        <div className="alert alert-success animate-fade-in" style={{ margin: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <span>{liveApplicantAlert}</span>
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ margin: '1.25rem 0' }}>
          {message.text}
        </div>
      )}

      {/* Post New Job Form */}
      {showPostForm && (
        <div className="form-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Create a New Job Listing</h3>
              <p className="subtext" style={{ margin: '0.25rem 0 0' }}>
                Publish an open position for candidates to browse and apply.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAiGenerateJob}
              disabled={generatingAi}
              className="btn btn-outline"
              style={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 600 }}
            >
              {generatingAi ? '✨ Drafting with AI...' : '✨ Auto-Draft with Gemini AI'}
            </button>
          </div>
          <form onSubmit={handlePostJob} style={{ marginTop: '1.25rem' }}>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Job Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Senior Backend Engineer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Employment Type *</label>
                <select
                  className="form-control"
                  value={newJob.jobType}
                  onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Location *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bangalore, India or Remote"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Salary / Compensation Range</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ₹12,00,000 - ₹18,00,000"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Required Skills (comma-separated, enables Skill-Matching)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Java, Spring Boot, React, SQL, Git"
                value={newJob.requirements}
                onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Key responsibilities, team culture, requirements, and perks..."
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span> Publishing...
                  </>
                ) : (
                  'Publish Job Listing'
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowPostForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Job Form */}
      {editingJob && (
        <div className="form-card" style={{ marginBottom: '2rem', border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Edit Job Listing #{editingJob.id}</h3>
            <button
              onClick={() => setEditingJob(null)}
              className="btn btn-outline btn-sm"
            >
              ✕ Cancel Editing
            </button>
          </div>
          <form onSubmit={handleUpdateJob} style={{ marginTop: '1rem' }}>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Job Title *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingJob.title}
                  onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Employment Type *</label>
                <select
                  className="form-control"
                  value={editingJob.jobType}
                  onChange={(e) => setEditingJob({ ...editingJob, jobType: e.target.value })}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Location *</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingJob.location}
                  onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Compensation</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingJob.salary}
                  onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Required Skills (comma-separated)</label>
              <input
                type="text"
                className="form-control"
                value={editingJob.requirements}
                onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                className="form-control"
                rows={4}
                value={editingJob.description}
                onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditingJob(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recruiter Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-details">
            <span className="stat-number">{jobs.length}</span>
            <span className="stat-label">Total Jobs Posted</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-details">
            <span className="stat-number">{jobs.filter((j) => j.active).length}</span>
            <span className="stat-label">Active Job Openings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <span className="stat-number">{totalApplicants}</span>
            <span className="stat-label">Total Candidates Applied</span>
          </div>
          <Link to="/applications" className="stat-link">Review Applicants &rarr;</Link>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <Link to="/interviews" className="stat-link" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
              Manage Interviews &rarr;
            </Link>
            <span className="stat-label">Schedule & Notes</span>
          </div>
        </div>
      </div>

      {/* Posted Jobs Management Table */}
      <div className="dashboard-card" style={{ marginTop: '2rem' }}>
        <div className="dashboard-card-header">
          <h3>Your Job Postings</h3>
          <span className="subtext">{jobs.length} total positions</span>
        </div>

        {loading ? (
          <p className="loading-state">Loading your job postings...</p>
        ) : jobs.length === 0 ? (
          <div className="empty-state-compact">
            <p>You haven't posted any jobs yet.</p>
            <button
              onClick={() => setShowPostForm(true)}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '0.75rem' }}
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <strong>
                        <Link to={`/jobs/${j.id}`} className="text-link">
                          {j.title}
                        </Link>
                      </strong>
                      <div className="subtext">ID: #{j.id} &bull; Posted: {j.postedDate || 'Recent'}</div>
                    </td>
                    <td>{j.jobType || 'Full-time'}</td>
                    <td>{j.location}</td>
                    <td>
                      <span className={`badge ${j.active ? 'badge-success' : 'badge-danger'}`}>
                        {j.active ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/applications`} className="btn btn-outline btn-sm">
                        View Applicants &rarr;
                      </Link>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', minWidth: '230px' }}>
                        <button
                          onClick={() => handleEditJobClick(j)}
                          className="btn btn-outline btn-sm"
                          title="Edit Position Details"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleToggleJobStatus(j.id, j.active)}
                          className={`btn btn-sm ${j.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        >
                          {j.active ? '⏸ Close' : '▶ Reopen'}
                        </button>
                        <button
                          onClick={() => handleDeleteJob(j.id)}
                          className="btn btn-outline-danger btn-sm"
                          disabled={deletingId === j.id}
                        >
                          {deletingId === j.id ? (
                            <>
                              <span className="btn-spinner"></span>
                            </>
                          ) : (
                            '🗑️ Delete'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;
