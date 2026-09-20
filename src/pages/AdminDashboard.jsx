import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import aiService from '../services/aiService';

const AdminDashboard = ({ initialTab = 'users' }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab); // 'users' | 'jobs' | 'applications'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Filters & Searches
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
  const [jobSearch, setJobSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');
  const [appSearch, setAppSearch] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, jobsRes, appsRes, aiStatusRes] = await Promise.all([
        axiosClient.get('/admin/stats'),
        axiosClient.get('/admin/users'),
        axiosClient.get('/admin/jobs'),
        axiosClient.get('/admin/applications'),
        aiService.getAiStatus(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setJobs(jobsRes.data || []);
      setApplications(appsRes.data || []);
      setAiStatus(aiStatusRes);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId, userName, currentActive) => {
    setActionMessage({ type: '', text: '' });
    try {
      await axiosClient.put(`/admin/users/${userId}/toggle-status?adminId=${user?.id}`);
      setActionMessage({
        type: 'success',
        text: `User "${userName}" has been ${currentActive ? 'deactivated' : 'activated'} successfully.`,
      });
      fetchAdminData();
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to update user status.',
      });
    }
  };

  const handleToggleJob = async (jobId, jobTitle, currentActive) => {
    setActionMessage({ type: '', text: '' });
    try {
      await axiosClient.put(`/admin/jobs/${jobId}/toggle-status?adminId=${user?.id}`);
      setActionMessage({
        type: 'success',
        text: `Job listing "${jobTitle}" is now ${currentActive ? 'inactive (closed)' : 'active (open)'}.`,
      });
      fetchAdminData();
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: err.response?.data?.error || err.response?.data?.message || 'Failed to update job status.',
      });
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesRole = userRoleFilter === 'ALL' || u.role?.toUpperCase() === userRoleFilter;
    const matchesSearch =
      !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredJobs = jobs.filter((j) => {
    const matchesStatus =
      jobStatusFilter === 'ALL' ||
      (jobStatusFilter === 'ACTIVE' && j.active) ||
      (jobStatusFilter === 'INACTIVE' && !j.active);
    const matchesSearch =
      !jobSearch ||
      j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.company?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.companyName?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location?.toLowerCase().includes(jobSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredApplications = applications.filter((a) => {
    const matchesStatus =
      appStatusFilter === 'ALL' || a.status?.toUpperCase() === appStatusFilter;
    const matchesSearch =
      !appSearch ||
      a.jobTitle?.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.companyName?.toLowerCase().includes(appSearch.toLowerCase()) ||
      String(a.candidateId).includes(appSearch) ||
      String(a.id).includes(appSearch);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="section-container">
        <p className="loading-state">Loading administrator platform...</p>
      </div>
    );
  }

  return (
    <div className="section-container animate-fade-in">
      {/* Luxury Dark Welcome Banner */}
      <div className="dashboard-welcome">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(59, 130, 246, 0.25)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, color: '#93c5fd', marginBottom: '0.65rem' }}>
            🛡️ Platform Moderation & Control Center
          </div>
          <h1>Platform Administration</h1>
          <p className="subtitle">Real-time system telemetry, user & job moderation, and autonomous engine monitoring.</p>
        </div>
        <div className="dashboard-welcome-actions">
          <button onClick={fetchAdminData} className="btn btn-outline" style={{ borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}>
            ↻ Refresh Live Data
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}
      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type}`} style={{ marginBottom: '1.25rem' }}>
          {actionMessage.text}
        </div>
      )}

      {/* 6 Balanced Platform & AI Metrics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-details">
              <span className="stat-number">{stats.totalUsers}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👨‍💻</div>
            <div className="stat-details">
              <span className="stat-number">{stats.totalCandidates}</span>
              <span className="stat-label">Candidates</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-details">
              <span className="stat-number">{stats.totalRecruiters}</span>
              <span className="stat-label">Recruiters</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-details">
              <span className="stat-number">
                {stats.totalJobs} <small style={{ fontSize: '0.82rem', color: '#64748b' }}>({stats.activeJobs} Active)</small>
              </span>
              <span className="stat-label">Total Jobs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-details">
              <span className="stat-number">{stats.totalApplications}</span>
              <span className="stat-label">Applications</span>
            </div>
          </div>

          <div className="stat-card stat-card-ai">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)', borderColor: '#c084fc' }}>
              ✨
            </div>
            <div className="stat-details">
              <span className="stat-number" style={{ fontSize: '1.25rem', color: aiStatus?.active ? '#7c3aed' : '#2563eb' }}>
                {aiStatus?.active ? 'Active' : 'Offline'}
              </span>
              <span className="stat-label" style={{ fontSize: '0.78rem' }}>
                {aiStatus?.mode || 'AI Intelligence'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Manage Users <span className="tab-badge">{users.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          Manage Jobs <span className="tab-badge">{jobs.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          View Applications <span className="tab-badge">{applications.length}</span>
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="dashboard-card">
          <div className="filter-bar">
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                <option value="CANDIDATE">Candidates Only</option>
                <option value="RECRUITER">Recruiters Only</option>
                <option value="ADMIN">Admins Only</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-state-compact">
              <p>No users match the selected filters.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Platform Role</th>
                    <th>Account Status</th>
                    <th>Moderation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'ADMIN'
                              ? 'badge-primary'
                              : u.role === 'RECRUITER'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                          {u.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'ADMIN' ? (
                          <button
                            onClick={() => handleToggleUser(u.id, u.name, u.active)}
                            className={`btn btn-sm ${u.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          >
                            {u.active ? '⛔ Deactivate' : '✓ Activate'}
                          </button>
                        ) : (
                          <span className="subtext" style={{ fontSize: '0.85rem' }}>Protected Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: JOBS */}
      {activeTab === 'jobs' && (
        <div className="dashboard-card">
          <div className="filter-bar">
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search job by title, company, or location..."
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value)}
              >
                <option value="ALL">All Postings</option>
                <option value="ACTIVE">Active (Open) Only</option>
                <option value="INACTIVE">Inactive (Closed) Only</option>
              </select>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="empty-state-compact">
              <p>No job postings match the specified filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Position Title</th>
                    <th>Company Name</th>
                    <th>Location</th>
                    <th>Recruiter ID</th>
                    <th>Status</th>
                    <th>Moderation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((j) => (
                    <tr key={j.id}>
                      <td>#{j.id}</td>
                      <td>
                        <Link to={`/jobs/${j.id}`}>
                          <strong>{j.title}</strong>
                        </Link>
                      </td>
                      <td>{j.company || j.companyName || 'Not specified'}</td>
                      <td>{j.location}</td>
                      <td>Recruiter #{j.recruiterId}</td>
                      <td>
                        <span className={`badge ${j.active ? 'badge-success' : 'badge-danger'}`}>
                          {j.active ? 'Active & Open' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleJob(j.id, j.title, j.active)}
                          className={`btn btn-sm ${j.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        >
                          {j.active ? '⏸ Deactivate' : '▶ Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="dashboard-card">
          <div className="filter-bar">
            <div style={{ flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by job title, company, or candidate ID..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-control"
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
              >
                <option value="ALL">All Application Stages</option>
                <option value="APPLIED">APPLIED</option>
                <option value="REVIEWING">REVIEWING</option>
                <option value="SHORTLISTED">SHORTLISTED</option>
                <option value="INTERVIEW SCHEDULED">INTERVIEW SCHEDULED</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="empty-state-compact">
              <p>No candidate applications match the selected filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>App #</th>
                    <th>Candidate ID</th>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Submission Date</th>
                    <th>Current Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td>#{app.id}</td>
                      <td>
                        <strong>Candidate #{app.candidateId}</strong>
                      </td>
                      <td>
                        <Link to={`/jobs/${app.jobId}`}>
                          <strong>{app.jobTitle}</strong>
                        </Link>
                      </td>
                      <td>{app.companyName || 'Not specified'}</td>
                      <td>{app.appliedDate || 'Recent'}</td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
