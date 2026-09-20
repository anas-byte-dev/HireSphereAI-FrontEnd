import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import StatusBadge from '../components/StatusBadge';

const Applications = () => {
  const { user, role } = useAuth();
  const { addEventListener } = useRealtime();
  const [applications, setApplications] = useState([]);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [liveToast, setLiveToast] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user, role]);

  // Real-time synchronization for new applications
  useEffect(() => {
    if (!addEventListener) return;

    const unsubscribe = addEventListener('APPLICATION_SUBMITTED', (event) => {
      setLiveToast(`⚡ Real-Time Update: ${event.message || 'New applicant applied!'}`);
      setTimeout(() => setLiveToast(''), 7000);
      loadData();
    });

    return () => unsubscribe();
  }, [addEventListener, user, role, selectedJobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'CANDIDATE') {
        const res = await axiosClient.get(`/applications/candidate/${user.id}`);
        setApplications(res.data || []);
      } else if (role === 'RECRUITER') {
        const jobsRes = await axiosClient.get(`/jobs/recruiter/${user.id}`);
        const jobs = jobsRes.data || [];
        setRecruiterJobs(jobs);

        const targetJobId = selectedJobId || (jobs.length > 0 ? jobs[0].id : null);
        if (targetJobId) {
          if (!selectedJobId) setSelectedJobId(targetJobId);
          const appsRes = await axiosClient.get(`/applications/job/${targetJobId}`);
          setApplications(appsRes.data || []);
        } else {
          setApplications([]);
        }
      } else if (role === 'ADMIN') {
        const res = await axiosClient.get('/admin/applications');
        setApplications(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJobChange = async (jobId) => {
    setSelectedJobId(jobId);
    setLoading(true);
    try {
      const res = await axiosClient.get(`/applications/job/${jobId}`);
      setApplications(res.data || []);
    } catch (err) {
      console.error('Failed to load job applicants', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    setStatusUpdating(appId);
    setMessage({ type: '', text: '' });
    try {
      await axiosClient.put(
        `/applications/${appId}/status?recruiterId=${user.id}`,
        { status: newStatus }
      );
      setMessage({ type: 'success', text: `Application status updated to ${newStatus}` });
      if (selectedJobId) {
        const res = await axiosClient.get(`/applications/job/${selectedJobId}`);
        setApplications(res.data || []);
      }
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || err.response?.data?.error || 'Failed to update status.',
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const getStatusDescription = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'APPLIED':
        return 'Application submitted and received by recruiter.';
      case 'REVIEWING':
        return 'The hiring team is actively reviewing your qualifications.';
      case 'SHORTLISTED':
        return 'Great news! You have been shortlisted for this position.';
      case 'INTERVIEW SCHEDULED':
        return 'An interview has been scheduled with the recruiter.';
      case 'ACCEPTED':
        return 'Congratulations! Your application has been accepted.';
      case 'REJECTED':
        return 'The recruiter decided to pursue other candidates at this time.';
      default:
        return 'Application submitted.';
    }
  };

  return (
    <div className="section-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>
            {role === 'CANDIDATE' ? 'My Applications & Status Tracking' : 'Job Applicants & Submissions'}
          </h1>
          <p className="subtitle">
            {role === 'CANDIDATE'
              ? 'Track real-time progress and interview schedules for each applied job.'
              : 'Review applicants and update their hiring stages.'}
          </p>
        </div>
      </div>

      {liveToast && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <span>{liveToast}</span>
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {role === 'RECRUITER' && recruiterJobs.length > 0 && (
        <div className="filter-bar" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
          <label style={{ marginRight: '0.75rem', fontWeight: 600 }}>Select Job Listing:</label>
          <select
            className="form-control"
            style={{ maxWidth: '350px' }}
            value={selectedJobId}
            onChange={(e) => handleJobChange(e.target.value)}
          >
            {recruiterJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.active ? 'Active' : 'Closed'})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-card">
          <h3>No applications found</h3>
          <p>
            {role === 'CANDIDATE'
              ? "You haven't submitted any job applications yet."
              : 'No candidate applications submitted for this listing yet.'}
          </p>
          {role === 'CANDIDATE' && (
            <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Explore Open Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="dashboard-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>App #</th>
                  {role !== 'CANDIDATE' && <th>Candidate</th>}
                  {role !== 'CANDIDATE' && <th>Match Compatibility</th>}
                  <th>Job Title</th>
                  {role === 'CANDIDATE' && <th>Company</th>}
                  <th>Applied On</th>
                  <th>Status</th>
                  {role === 'CANDIDATE' && <th>Progress & Next Steps</th>}
                  {role === 'RECRUITER' && <th>Decision & Actions</th>}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>#{app.id}</td>
                    {role !== 'CANDIDATE' && (
                      <td>
                        <strong>{app.candidateName || `Candidate #${app.candidateId}`}</strong>
                        {app.candidateEmail && (
                          <div className="subtext">{app.candidateEmail}</div>
                        )}
                        {app.candidatePhone && (
                          <div className="subtext">{app.candidatePhone}</div>
                        )}
                      </td>
                    )}
                    {role !== 'CANDIDATE' && (
                      <td>
                        {app.matchScore != null ? (
                          <div>
                            <span
                              className={`badge ${app.matchScore >= 70 ? 'badge-success' : 'badge-warning'}`}
                            >
                              🎯 {Math.round(app.matchScore)}% Match
                            </span>
                            {app.matchingSkills && app.matchingSkills.length > 0 && (
                              <div className="subtext" style={{ marginTop: '0.25rem', fontSize: '0.78rem' }}>
                                ✓ {app.matchingSkills.slice(0, 3).join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-primary">Qualified</span>
                        )}
                      </td>
                    )}
                    <td>
                      <Link to={`/jobs/${app.jobId}`}>
                        <strong>{app.jobTitle}</strong>
                      </Link>
                    </td>
                    {role === 'CANDIDATE' && <td>{app.companyName}</td>}
                    <td>{app.appliedDate || 'Recent'}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    {role === 'CANDIDATE' && (
                      <td>
                        <span className="subtext">{getStatusDescription(app.status)}</span>
                        {(app.status === 'SHORTLISTED' || app.status === 'INTERVIEW SCHEDULED') && (
                          <div style={{ marginTop: '0.4rem' }}>
                            <Link to="/interviews" className="btn btn-outline btn-sm">
                              📅 View Interview Schedule &rarr;
                            </Link>
                          </div>
                        )}
                      </td>
                    )}
                    {role === 'RECRUITER' && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '240px' }}>
                          <select
                            className="form-control form-control-sm"
                            style={{ width: '135px' }}
                            value={app.status}
                            disabled={statusUpdating === app.id}
                            onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                          >
                            <option value="APPLIED">APPLIED</option>
                            <option value="REVIEWING">REVIEWING</option>
                            <option value="SHORTLISTED">SHORTLISTED</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                          <Link
                            to="/interviews"
                            state={{ applicationId: app.id, candidateId: app.candidateId }}
                            className="btn btn-primary btn-sm"
                            title="Schedule an interview with this candidate"
                          >
                            📅 Schedule
                          </Link>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
