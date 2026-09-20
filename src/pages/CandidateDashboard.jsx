import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [appsRes, savedRes, interviewsRes] = await Promise.all([
        axiosClient.get(`/applications/candidate/${user.id}`).catch(() => ({ data: [] })),
        axiosClient.get(`/saved-jobs/candidate/${user.id}`).catch(() => ({ data: [] })),
        axiosClient.get(`/interviews/candidate/${user.id}`).catch(() => ({ data: [] })),
      ]);
      setApplications(appsRes.data || []);
      setSavedJobs(savedRes.data || []);
      setInterviews(interviewsRes.data || []);
    } catch (err) {
      console.error('Error loading candidate dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-container animate-fade-in">
      <div className="dashboard-welcome">
        <h1>Welcome back, {user?.name || 'Candidate'}!</h1>
        <p className="subtitle">Here is a snapshot of your job search activity and AI coaching progress on HireSphere AI.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-details">
            <span className="stat-number">{applications.length}</span>
            <span className="stat-label">Applications Submitted</span>
          </div>
          <Link to="/applications" className="stat-link">View All &rarr;</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-details">
            <span className="stat-number">{savedJobs.length}</span>
            <span className="stat-label">Saved Jobs</span>
          </div>
          <Link to="/saved-jobs" className="stat-link">View Bookmarks &rarr;</Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <span className="stat-number">{interviews.length}</span>
            <span className="stat-label">Interviews Scheduled</span>
          </div>
          <Link to="/interviews" className="stat-link">View Schedule &rarr;</Link>
        </div>
      </div>

      <div className="dashboard-sections-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Recent Applications</h3>
            <Link to="/applications" className="text-link">See all</Link>
          </div>
          {loading ? (
            <p>Loading applications...</p>
          ) : applications.length === 0 ? (
            <div className="empty-state-compact">
              <p>You haven't applied for any jobs yet.</p>
              <Link to="/jobs" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="dashboard-list">
              {applications.slice(0, 4).map((app) => (
                <div key={app.id} className="dashboard-list-item">
                  <div>
                    <strong>{app.jobTitle}</strong>
                    <p className="subtext">{app.companyName} &bull; Applied: {app.appliedDate}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Upcoming Interviews</h3>
            <Link to="/interviews" className="text-link">See all</Link>
          </div>
          {loading ? (
            <p>Loading interviews...</p>
          ) : interviews.length === 0 ? (
            <div className="empty-state-compact">
              <p>No interviews currently scheduled.</p>
            </div>
          ) : (
            <div className="dashboard-list">
              {interviews.slice(0, 3).map((item) => (
                <div key={item.id} className="dashboard-list-item">
                  <div>
                    <strong>{item.mode} Interview</strong>
                    <p className="subtext">📅 {item.date} at {item.time}</p>
                    {item.meetingLink && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <a href={item.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                          🎥 Launch Meeting ↗
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="badge badge-primary">{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
