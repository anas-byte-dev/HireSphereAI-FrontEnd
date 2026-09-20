import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const SkillMatchWidget = ({ candidateId, jobId }) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (candidateId && jobId) {
      fetchSkillMatch();
    }
  }, [candidateId, jobId]);

  const fetchSkillMatch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get(`/skill-match/candidate/${candidateId}/job/${jobId}`);
      setMatchData(res.data);
    } catch (err) {
      setError('Unable to calculate skill match at this time.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="skill-match-card">
        <p className="subtext">Calculating skill compatibility with your profile...</p>
      </div>
    );
  }

  if (error || !matchData) {
    return null; // Don't show broken widget if not available
  }

  const percentage = Math.round(matchData.matchPercentage || 0);

  // Determine color and threshold status based on 70% requirement
  let progressColor = 'var(--primary)';
  let ratingText = 'Under 70% Threshold';
  let isQualified = percentage >= 70;

  if (percentage >= 70) {
    progressColor = 'var(--success)';
    ratingText = '✅ Qualified to Apply';
  } else if (percentage >= 50) {
    progressColor = '#f59e0b';
    ratingText = '⚠️ Needs 70% Match';
  } else {
    progressColor = 'var(--danger)';
    ratingText = '❌ Low Compatibility';
  }

  return (
    <div className="skill-match-card">
      <div className="skill-match-header">
        <div className="skill-match-title-wrap">
          <span className="skill-match-icon">{isQualified ? '🎯' : '⚠️'}</span>
          <div>
            <h4>Skill Compatibility Score</h4>
            <p className="subtext">
              {matchData.matchSummary || `${percentage}% of required skills matched`}
              {!isQualified && ' — Minimum 70% match required to submit an application'}
            </p>
          </div>
        </div>
        <div className="skill-match-score-badge" style={{ color: progressColor }}>
          <span className="score-number">{percentage}%</span>
          <span className="score-rating">{ratingText}</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%`, backgroundColor: progressColor }}
        />
      </div>

      <div className="skills-breakdown-grid">
        {matchData.matchingSkills && matchData.matchingSkills.length > 0 && (
          <div className="skills-column">
            <span className="column-title text-success">
              ✓ Matching Skills ({matchData.matchingSkills.length})
            </span>
            <div className="skills-tags">
              {matchData.matchingSkills.map((skill, i) => (
                <span key={i} className="skill-tag skill-tag-matched">
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {matchData.missingSkills && matchData.missingSkills.length > 0 && (
          <div className="skills-column">
            <span className="column-title text-muted">
              + Missing Skills ({matchData.missingSkills.length})
            </span>
            <div className="skills-tags">
              {matchData.missingSkills.map((skill, i) => (
                <span key={i} className="skill-tag skill-tag-missing">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillMatchWidget;
