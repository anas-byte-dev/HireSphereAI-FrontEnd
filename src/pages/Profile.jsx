import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const Profile = ({ initialTab = 'recruiter' }) => {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Candidate fields
  const [candidateProfile, setCandidateProfile] = useState({
    headline: '',
    bio: '',
    phone: '',
    location: '',
    education: '',
    experience: '',
    resumeUrl: '',
    githubUrl: '',
    linkedInUrl: '',
    skills: [],
  });
  const [newSkillInput, setNewSkillInput] = useState('');

  // Recruiter fields
  const [recruiterProfile, setRecruiterProfile] = useState({
    designation: '',
    phone: '',
    linkedIn: '',
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    industry: 'IT / Software',
    location: '',
    website: '',
    size: 0,
    contactEmail: '',
    contactPhone: '',
    description: '',
  });

  const [activeRecruiterTab, setActiveRecruiterTab] = useState(initialTab); // 'recruiter' | 'company'

  useEffect(() => {
    if (initialTab) {
      setActiveRecruiterTab(initialTab);
    }
  }, [initialTab]);

  const handleSaveRecruiter = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        designation: recruiterProfile.designation,
        phone: recruiterProfile.phone,
        linkedIn: recruiterProfile.linkedIn,
      };
      await axiosClient.put(`/recruiters/${user.id}/profile`, payload);
      setMessage({ type: 'success', text: 'Recruiter personal profile updated successfully!' });
    } catch (err) {
      const serverErr = err.response?.data?.error || err.response?.data?.message;
      setMessage({ type: 'danger', text: serverErr || 'Failed to update recruiter profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        name: companyInfo.name,
        industry: companyInfo.industry,
        location: companyInfo.location,
        website: companyInfo.website,
        size: Number(companyInfo.size) || 0,
        contactEmail: companyInfo.contactEmail,
        contactPhone: companyInfo.contactPhone,
        description: companyInfo.description,
      };
      await axiosClient.put(`/recruiters/${user.id}/company`, payload);
      setMessage({ type: 'success', text: 'Company information updated successfully!' });
    } catch (err) {
      const serverErr = err.response?.data?.error || err.response?.data?.message;
      setMessage({ type: 'danger', text: serverErr || 'Failed to update company info.' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (role === 'CANDIDATE') {
        const res = await axiosClient.get(`/candidates/${user.id}/profile`);
        const data = res.data;
        setCandidateProfile({
          headline: data.headline || '',
          bio: data.bio || '',
          phone: data.phone || '',
          location: data.location || '',
          education: data.education || '',
          experience: data.experience || '',
          resumeUrl: data.resumeUrl || '',
          githubUrl: data.githubUrl || '',
          linkedInUrl: data.linkedInUrl || '',
          skills: Array.isArray(data.skills) ? data.skills : [],
        });
      } else if (role === 'RECRUITER') {
        const [profRes, compRes] = await Promise.all([
          axiosClient.get(`/recruiters/${user.id}/profile`).catch(() => ({ data: {} })),
          axiosClient.get(`/recruiters/${user.id}/company`).catch(() => ({ data: {} })),
        ]);
        const data = profRes.data || {};
        const comp = compRes.data || {};
        setRecruiterProfile({
          designation: data.designation || '',
          phone: data.phone || '',
          linkedIn: data.linkedIn || '',
        });
        setCompanyInfo({
          name: comp.name || user.name || '',
          industry: comp.industry || 'IT / Software',
          location: comp.location || '',
          website: comp.website || '',
          size: comp.size || 0,
          contactEmail: comp.contactEmail || user.email || '',
          contactPhone: comp.contactPhone || '',
          description: comp.description || '',
        });
      }
    } catch (err) {
      console.warn('Profile loading note:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;

    // Handle comma-separated input
    const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    const existing = new Set(candidateProfile.skills.map((s) => s.toLowerCase()));

    const toAdd = parts.filter((s) => !existing.has(s.toLowerCase()));
    if (toAdd.length > 0) {
      setCandidateProfile({
        ...candidateProfile,
        skills: [...candidateProfile.skills, ...toAdd],
      });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setCandidateProfile({
      ...candidateProfile,
      skills: candidateProfile.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleSaveCandidate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        headline: candidateProfile.headline,
        bio: candidateProfile.bio,
        phone: candidateProfile.phone,
        location: candidateProfile.location,
        education: candidateProfile.education,
        experience: candidateProfile.experience,
        resumeUrl: candidateProfile.resumeUrl,
        githubUrl: candidateProfile.githubUrl,
        linkedInUrl: candidateProfile.linkedInUrl,
        skills: candidateProfile.skills,
      };

      await axiosClient.put(`/candidates/${user.id}/profile`, payload);
      setMessage({ type: 'success', text: 'Candidate profile and skills updated successfully!' });
    } catch (err) {
      const serverErr = err.response?.data?.error || err.response?.data?.message;
      setMessage({ type: 'danger', text: serverErr || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="section-container animate-fade-in">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1>{role === 'CANDIDATE' ? 'Candidate Profile & Skills' : 'My Profile'}</h1>
          <p className="subtitle">
            {role === 'CANDIDATE'
              ? 'Keep your skills and qualifications updated to get accurate skill-match scores on jobs.'
              : 'Manage your recruiter and company profile details.'}
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="avatar-placeholder">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3>{user?.name}</h3>
            <p className="subtext">{user?.email}</p>
            <span className="badge badge-primary">{user?.role}</span>

            {role === 'CANDIDATE' && (
              <div className="sidebar-profile-stats" style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <p className="subtext">
                  <strong>Skills Listed:</strong> {candidateProfile.skills.length}
                </p>
                <p className="subtext">
                  <strong>Location:</strong> {candidateProfile.location || 'Not set'}
                </p>
                <p className="subtext">
                  <strong>Experience:</strong> {candidateProfile.experience || 'Fresher'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="profile-main">
          {role === 'CANDIDATE' && (
            <div className="form-card">
              <h3>Professional Profile</h3>
              <form onSubmit={handleSaveCandidate}>
                <div className="form-group">
                  <label>Professional Headline</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Java Developer | 2025 Fresher"
                    value={candidateProfile.headline}
                    onChange={(e) =>
                      setCandidateProfile({ ...candidateProfile, headline: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Bio / About Me</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Brief description of your passion, background, and goals..."
                    value={candidateProfile.bio}
                    onChange={(e) =>
                      setCandidateProfile({ ...candidateProfile, bio: e.target.value })
                    }
                  />
                </div>

                {/* Skills Management Section */}
                <div className="form-group" style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <label>Technical Skills (Used for automatic Skill-Matching on Job Listings)</label>
                  <p className="subtext" style={{ marginBottom: '0.75rem' }}>
                    Type a skill and press Enter or click <strong>Add Skill</strong>. You can also paste comma-separated skills.
                  </p>

                  <div className="skill-input-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Java, Spring Boot, React, SQL, Git..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      + Add Skill
                    </button>
                  </div>

                  {candidateProfile.skills.length === 0 ? (
                    <p className="subtext" style={{ fontStyle: 'italic' }}>
                      No skills added yet. Adding skills will enable automatic job matching!
                    </p>
                  ) : (
                    <div className="skills-tags" style={{ marginTop: '0.5rem' }}>
                      {candidateProfile.skills.map((skill, index) => (
                        <span key={index} className="skill-tag skill-tag-interactive">
                          {skill}
                          <button
                            type="button"
                            className="skill-remove-btn"
                            onClick={() => handleRemoveSkill(skill)}
                            title="Remove skill"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Location</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mumbai, India"
                      value={candidateProfile.location}
                      onChange={(e) =>
                        setCandidateProfile({ ...candidateProfile, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 91234 56789"
                      value={candidateProfile.phone}
                      onChange={(e) =>
                        setCandidateProfile({ ...candidateProfile, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Education</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. B.Tech CSE - Mumbai University (2025)"
                      value={candidateProfile.education}
                      onChange={(e) =>
                        setCandidateProfile({ ...candidateProfile, education: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Experience Level</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Fresher or 1-2 Years"
                      value={candidateProfile.experience}
                      onChange={(e) =>
                        setCandidateProfile({ ...candidateProfile, experience: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Resume Link / Portfolio Document URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="e.g. https://drive.google.com/your-resume-pdf"
                    value={candidateProfile.resumeUrl}
                    onChange={(e) =>
                      setCandidateProfile({ ...candidateProfile, resumeUrl: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>GitHub Profile URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="e.g. https://github.com/alice"
                      value={candidateProfile.githubUrl}
                      onChange={(e) =>
                        setCandidateProfile({ ...candidateProfile, githubUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="e.g. https://linkedin.com/in/alice"
                      value={candidateProfile.linkedInUrl}
                      onChange={(e) =>
                        setCandidateProfile({ ...candidateProfile, linkedInUrl: e.target.value })
                      }
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="btn-spinner"></span> Saving Profile...
                    </>
                  ) : (
                    '💾 Save Candidate Profile'
                  )}
                </button>
              </form>
            </div>
          )}

          {role === 'RECRUITER' && (
            <div>
              <div className="tab-bar">
                <button
                  type="button"
                  className={`tab-btn ${activeRecruiterTab === 'recruiter' ? 'active' : ''}`}
                  onClick={() => setActiveRecruiterTab('recruiter')}
                >
                  👤 Recruiter Profile
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeRecruiterTab === 'company' ? 'active' : ''}`}
                  onClick={() => setActiveRecruiterTab('company')}
                >
                  🏢 Company Information
                </button>
              </div>

              {activeRecruiterTab === 'recruiter' && (
                <div className="form-card">
                  <h3>Recruiter Personal Details</h3>
                  <p className="subtext" style={{ marginBottom: '1.25rem' }}>
                    Your individual recruiter credentials displayed to candidates.
                  </p>
                  <form onSubmit={handleSaveRecruiter}>
                    <div className="form-group">
                      <label>Designation / Role Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Technical Talent Acquisition Lead"
                        value={recruiterProfile.designation}
                        onChange={(e) =>
                          setRecruiterProfile({ ...recruiterProfile, designation: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>Direct Contact Phone</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. +91 98765 43210"
                          value={recruiterProfile.phone}
                          onChange={(e) =>
                            setRecruiterProfile({ ...recruiterProfile, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>LinkedIn Profile URL</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="e.g. https://linkedin.com/in/recruiter"
                          value={recruiterProfile.linkedIn}
                          onChange={(e) =>
                            setRecruiterProfile({ ...recruiterProfile, linkedIn: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="btn-spinner"></span> Saving...
                        </>
                      ) : (
                        'Save Recruiter Details'
                      )}
                    </button>
                  </form>
                </div>
              )}

              {activeRecruiterTab === 'company' && (
                <div className="form-card">
                  <h3>Company & Organization Profile</h3>
                  <p className="subtext" style={{ marginBottom: '1.25rem' }}>
                    Information about your company displayed on job postings and company listings.
                  </p>
                  <form onSubmit={handleSaveCompany}>
                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>Company Legal Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. TechCorp Solutions Ltd."
                          value={companyInfo.name}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>Industry</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. IT / Software / FinTech"
                          value={companyInfo.industry}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, industry: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>Headquarters Location</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Bangalore, India"
                          value={companyInfo.location}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, location: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>Company Size (Employees)</label>
                        <input
                          type="number"
                          className="form-control"
                          min={0}
                          placeholder="e.g. 500"
                          value={companyInfo.size}
                          onChange={(e) => setCompanyInfo({ ...companyInfo, size: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group flex-1">
                        <label>Official Website</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="e.g. https://techcorp.com"
                          value={companyInfo.website}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, website: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group flex-1">
                        <label>Corporate Contact Email</label>
                        <input
                          type="email"
                          className="form-control"
                          placeholder="e.g. hr@techcorp.com"
                          value={companyInfo.contactEmail}
                          onChange={(e) =>
                            setCompanyInfo({ ...companyInfo, contactEmail: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Company Description / Overview</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Brief overview of the company, mission, work culture, and products..."
                        value={companyInfo.description}
                        onChange={(e) =>
                          setCompanyInfo({ ...companyInfo, description: e.target.value })
                        }
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="btn-spinner"></span> Saving...
                        </>
                      ) : (
                        'Save Company Information'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
