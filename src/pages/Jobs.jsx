import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const Jobs = () => {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    fetchJobs();
    if (user && role === 'CANDIDATE') {
      fetchCandidateSkills();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get('/jobs');
      setJobs(res.data || []);
    } catch (err) {
      setError('Failed to retrieve job listings. Please check back later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateSkills = async () => {
    try {
      const res = await axiosClient.get(`/candidates/${user.id}/profile`);
      if (res.data && Array.isArray(res.data.skills)) {
        setCandidateSkills(res.data.skills.map((s) => s.toLowerCase()));
      }
    } catch (err) {
      console.warn('Candidate skills fetch note:', err.message);
    }
  };

  const calculateQuickMatch = (skillsList) => {
    if (!skillsList || skillsList.length === 0 || candidateSkills.length === 0) return null;
    const reqLower = skillsList.map((r) => r.toLowerCase());
    const matchedCount = reqLower.filter((r) => candidateSkills.includes(r)).length;
    const pct = Math.round((matchedCount / reqLower.length) * 100);
    return { pct, matchedCount, total: reqLower.length };
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase().trim();
    const l = locationQuery.toLowerCase().trim();
    const comp = (job.companyName || job.company || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const reqStr = Array.isArray(job.skills)
      ? job.skills.join(' ').toLowerCase()
      : typeof job.requirements === 'string'
      ? job.requirements.toLowerCase()
      : Array.isArray(job.requirements)
      ? job.requirements.join(' ').toLowerCase()
      : '';

    const matchesQuery =
      !q ||
      title.includes(q) ||
      comp.includes(q) ||
      desc.includes(q) ||
      reqStr.includes(q);

    const matchesLocation = !l || (job.location || '').toLowerCase().includes(l);

    const jobEmployment = (job.jobType || job.employmentType || '').toUpperCase();
    const matchesType =
      selectedType === 'ALL' ||
      jobEmployment === selectedType.toUpperCase();

    return matchesQuery && matchesLocation && matchesType;
  });

  return (
    <div className="section-container">
      <div className="page-header">
        <div>
          <h1>Explore Job Opportunities</h1>
          <p className="subtitle">
            Find the right job match for your skills and career aspirations.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar" style={{ gap: '0.75rem', alignItems: 'center' }}>
        <div className="search-input-wrap">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search job title, company, skill (e.g. Java, React)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="📍 Filter location (e.g. Bangalore)..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />
        </div>

        <div className="filter-select-wrap">
          <select
            className="form-control"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Employment Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        {(searchQuery || locationQuery || selectedType !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setLocationQuery('');
              setSelectedType('ALL');
            }}
            className="btn btn-outline btn-sm"
            title="Clear all active filters"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading available positions...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="empty-card">
          <h3>No matching jobs found</h3>
          <p>Try clearing or modifying your search terms.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setLocationQuery('');
              setSelectedType('ALL');
            }}
            className="btn btn-outline"
            style={{ marginTop: '1rem' }}
          >
            🔄 Reset Filters
          </button>
        </div>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map((job) => {
            const skillsToDisplay = Array.isArray(job.skills) && job.skills.length > 0
              ? job.skills
              : Array.isArray(job.requirements)
              ? job.requirements
              : typeof job.requirements === 'string' && job.requirements.trim()
              ? job.requirements.split(',').map((s) => s.trim()).filter(Boolean)
              : [];

            const matchInfo = role === 'CANDIDATE' ? calculateQuickMatch(skillsToDisplay) : null;
            const companyDisplayName = job.company || job.companyName || 'Hiring Company';
            const salaryText = job.salary || job.salaryRange;

            return (
              <div key={job.id} className="job-list-card">
                <div className="job-list-main">
                  <div className="job-list-title-row">
                    <Link to={`/jobs/${job.id}`} className="job-title-link">
                      <h3>{job.title}</h3>
                    </Link>
                    <span className="badge badge-primary">{job.jobType || job.employmentType || 'Full-time'}</span>
                    {matchInfo && matchInfo.pct > 0 && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            matchInfo.pct >= 70 ? 'var(--success-light)' : 'var(--warning-light)',
                          color: matchInfo.pct >= 70 ? 'var(--success)' : 'var(--warning)',
                        }}
                      >
                        {matchInfo.pct}% Match
                      </span>
                    )}
                  </div>
                  <p className="job-company">{companyDisplayName}</p>
                  <div className="job-meta">
                    <span>📍 {job.location}</span>
                    {salaryText && <span>💵 {salaryText}</span>}
                    <span>📅 {job.postedDate ? `Posted ${job.postedDate}` : 'Recently posted'}</span>
                  </div>

                  {skillsToDisplay.length > 0 && (
                    <div className="skills-tags">
                      {skillsToDisplay.slice(0, 6).map((req, idx) => {
                        const isMatched =
                          candidateSkills.length > 0 && candidateSkills.includes(req.toLowerCase());

                        return (
                          <span
                            key={idx}
                            className={`skill-tag ${isMatched ? 'skill-tag-matched' : ''}`}
                          >
                            {isMatched ? '✓ ' : ''}
                            {req}
                          </span>
                        );
                      })}
                      {skillsToDisplay.length > 6 && (
                        <span className="skill-tag" style={{ color: 'var(--text-muted)' }}>
                          +{skillsToDisplay.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="job-list-action">
                  <Link to={`/jobs/${job.id}`} className="btn btn-primary">
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Jobs;
