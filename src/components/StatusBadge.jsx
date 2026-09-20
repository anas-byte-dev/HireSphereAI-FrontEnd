import React from 'react';

/**
 * StatusBadge - Standardized, accessible status indicator for jobs,
 * applications, and user accounts across CareerHub.
 */
const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase().trim();
  let badgeClass = 'badge-secondary';

  switch (normalized) {
    case 'SHORTLISTED':
      badgeClass = 'badge-shortlisted';
      break;
    case 'REVIEWING':
      badgeClass = 'badge-reviewing';
      break;
    case 'ACCEPTED':
    case 'SELECTED':
    case 'ACTIVE':
    case 'OPEN':
      badgeClass = 'badge-success';
      break;
    case 'REJECTED':
    case 'INACTIVE':
    case 'CLOSED':
      badgeClass = 'badge-danger';
      break;
    case 'INTERVIEW':
    case 'INTERVIEW SCHEDULED':
      badgeClass = 'badge-interview';
      break;
    case 'APPLIED':
    default:
      badgeClass = 'badge-applied';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      {status || 'APPLIED'}
    </span>
  );
};

export default StatusBadge;
