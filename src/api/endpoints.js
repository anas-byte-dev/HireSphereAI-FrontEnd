/**
 * HireSphere AI - Master API Endpoints Registry
 * 
 * ALL API endpoints and routes in one centralized, easily accessible location.
 * Modify or inspect any API route directly from here.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://hiresphereai.onrender.com/api';
export const REALTIME_STREAM_URL = import.meta.env.VITE_REALTIME_STREAM_URL || 'https://hiresphereai.onrender.com/api/realtime/stream';
export const SWAGGER_URL = import.meta.env.VITE_SWAGGER_URL || 'http://localhost:8085/swagger-ui.html';
export const H2_CONSOLE_URL = import.meta.env.VITE_H2_CONSOLE_URL || 'http://localhost:8085/h2-console';

export const API_ENDPOINTS = {
  // System Health & Diagnostics
  HEALTH: {
    CHECK: '/health',
  },

  // Authentication & Session
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },

  // Candidate Profile Management
  CANDIDATE: {
    PROFILE: '/candidate/profile',
    UPDATE_PROFILE: '/candidate/profile',
  },

  // Recruiter Profile & Company Management
  RECRUITER: {
    PROFILE: '/recruiter/profile',
    COMPANY: '/companies/my',
    UPDATE_COMPANY: '/companies',
  },

  // Job Postings & Discovery
  JOBS: {
    LIST: '/jobs',
    DETAILS: (id) => `/jobs/${id}`,
    CREATE: '/jobs',
    UPDATE: (id) => `/jobs/${id}`,
    DELETE: (id) => `/jobs/${id}`,
  },

  // Job Applications Lifecycle
  APPLICATIONS: {
    APPLY: '/applications',
    MY: '/applications/my',
    BY_JOB: (jobId) => `/applications/job/${jobId}`,
    UPDATE_STATUS: (id) => `/applications/${id}/status`,
  },

  // Saved / Bookmarked Jobs
  SAVED_JOBS: {
    LIST: '/saved-jobs',
    SAVE: (jobId) => `/saved-jobs/${jobId}`,
    REMOVE: (jobId) => `/saved-jobs/${jobId}`,
  },

  // Skill Matching Engine
  SKILL_MATCH: {
    CALCULATE: (jobId) => `/skill-match/${jobId}`,
  },

  // Interview Coordination
  INTERVIEWS: {
    SCHEDULE: '/interviews',
    MY: '/interviews/my',
    UPDATE: (id) => `/interviews/${id}`,
  },

  // User Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id) => `/notifications/${id}/read`,
  },

  // Platform Administration & Moderation
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    TOGGLE_USER: (id) => `/admin/users/${id}/toggle-status`,
    JOBS: '/admin/jobs',
    TOGGLE_JOB: (id) => `/admin/jobs/${id}/toggle-status`,
    APPLICATIONS: '/admin/applications',
  },

  // Autonomous Agentic AI
  AI: {
    // Agent 1: Autonomous Resume & Candidate Screening
    SCREEN: '/ai/screen',
    ANALYSES_BY_JOB: (jobId) => `/ai/analysis/job/${jobId}`,
    ANALYSES_BY_CANDIDATE: (candidateId) => `/ai/analysis/candidate/${candidateId}`,

    // Agent 2: Interactive AI Mock Interviewer & Coach
    INTERVIEW_START: '/ai/interview/start',
    INTERVIEW_MESSAGE: '/ai/interview/message',
    INTERVIEW_TRANSCRIPT: (sessionId) => `/ai/interview/session/${sessionId}`,

    // Agent 3: AI Job Description & Skills Generator
    GENERATE_JOB: '/ai/generate-job',
  },

  // Live Real-Time Server-Sent Events (SSE)
  REALTIME: {
    STREAM: '/realtime/stream',
  },
};

export default API_ENDPOINTS;
