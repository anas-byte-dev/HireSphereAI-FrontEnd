import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const Interviews = () => {
  const { user, role } = useAuth();
  const location = useLocation();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: '',
    candidateId: '',
    date: '',
    time: '',
    mode: 'Online (Google Meet)',
    meetingLink: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (location.state?.applicationId) {
      setShowScheduleForm(true);
      setFormData((prev) => ({
        ...prev,
        applicationId: location.state.applicationId,
        candidateId: location.state.candidateId || '',
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (user?.id) {
      loadInterviews();
    }
  }, [user, role]);

  const loadInterviews = async () => {
    setLoading(true);
    try {
      if (role === 'CANDIDATE') {
        const res = await axiosClient.get(`/interviews/candidate/${user.id}`);
        setInterviews(res.data || []);
      } else if (role === 'RECRUITER') {
        const res = await axiosClient.get(`/interviews/recruiter/${user.id}`);
        setInterviews(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load interviews', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        applicationId: Number(formData.applicationId),
        candidateId: Number(formData.candidateId),
        recruiterId: user.id,
        date: formData.date,
        time: formData.time,
        mode: formData.mode,
        meetingLink: formData.meetingLink,
        status: 'SCHEDULED',
        notes: formData.notes,
      };

      await axiosClient.post('/interviews', payload);
      setMessage({ type: 'success', text: 'Interview scheduled successfully!' });
      setShowScheduleForm(false);
      setFormData({
        applicationId: '',
        candidateId: '',
        date: '',
        time: '',
        mode: 'Online (Google Meet)',
        meetingLink: '',
        notes: '',
      });
      loadInterviews();
    } catch (err) {
      const errText = err.response?.data?.message || err.response?.data?.error || 'Failed to schedule interview.';
      setMessage({ type: 'danger', text: errText });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-container animate-fade-in">
      <div className="dashboard-header-flex">
        <div>
          <h1>Interviews & Meeting Schedules</h1>
          <p className="subtitle">
            {role === 'CANDIDATE'
              ? 'View all scheduled discussions, meetings, and instructions from recruiters.'
              : 'Schedule and manage interviews with promising applicants.'}
          </p>
        </div>
        {role === 'RECRUITER' && (
          <button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="btn btn-primary"
          >
            {showScheduleForm ? '✕ Close Form' : '+ Schedule New Interview'}
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ margin: '1rem 0' }}>
          {message.text}
        </div>
      )}

      {showScheduleForm && (
        <div className="form-card" style={{ marginBottom: '2rem' }}>
          <h3>Schedule an Interview</h3>
          <form onSubmit={handleScheduleInterview}>
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Application ID *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 1"
                  value={formData.applicationId}
                  onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Candidate User ID *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 3"
                  value={formData.candidateId}
                  onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Time *</label>
                <input
                  type="time"
                  className="form-control"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label>Mode</label>
                <select
                  className="form-control"
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                >
                  <option value="Online (Google Meet)">Online (Google Meet)</option>
                  <option value="Online (Zoom)">Online (Zoom)</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Phone Screening">Phone Screening</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Meeting Link or Office Room</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. https://meet.google.com/abc-defg-hij or Meeting Room A"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Interview Notes / Topic</label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Details about round format (e.g. Technical Coding Round - 45 min)..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span> Scheduling...
                  </>
                ) : (
                  'Confirm & Schedule'
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowScheduleForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your interview schedule...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="empty-card">
          <h3>No interviews scheduled</h3>
          <p>
            {role === 'CANDIDATE'
              ? 'You do not have any interviews scheduled yet. Once a recruiter shortlists your application and books a session, it will appear here.'
              : 'You have not scheduled any candidate interviews yet.'}
          </p>
          {role === 'CANDIDATE' && (
            <Link to="/applications" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Check Application Status
            </Link>
          )}
        </div>
      ) : (
        <div className="jobs-list">
          {interviews.map((item) => (
            <div key={item.id} className="job-list-card">
              <div className="job-list-main">
                <div className="job-list-title-row">
                  <h3>{item.mode}</h3>
                  <span className="badge badge-primary">{item.status || 'SCHEDULED'}</span>
                </div>
                <div className="job-meta" style={{ marginTop: '0.5rem' }}>
                  <span>📅 <strong>Date:</strong> {item.date}</span>
                  <span>⏰ <strong>Time:</strong> {item.time}</span>
                  <span><strong>Application Ref:</strong> #{item.applicationId}</span>
                </div>

                {item.meetingLink && (
                  <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Meeting Portal:</span>
                    <a
                      href={item.meetingLink.startsWith('http') ? item.meetingLink : `https://${item.meetingLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      🎥 Launch Video Meeting ↗
                    </a>
                  </div>
                )}

                {item.notes && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <p className="subtext">
                      <strong>Recruiter Notes:</strong> {item.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Interviews;
