import axios from 'axios';
import { supabaseDb } from '../lib/supabaseData';
import { isSupabaseConfigured } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Supabase token / local token if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hiresphere_token') || localStorage.getItem('careerhub_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Native fetch/XHR fallback adapter
const defaultAdapter = axios.defaults.adapter;

/**
 * Supabase Transparent Data Interceptor
 * Fulfills all database and business queries directly through real Supabase PostgreSQL!
 */
axiosClient.defaults.adapter = async (config) => {
  if (!isSupabaseConfigured()) {
    return defaultAdapter(config);
  }

  const url = (config.url || '').replace(/^\/api/, '');
  const method = (config.method || 'get').toLowerCase();

  let body = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch (e) {
      body = config.data;
    }
  }

  // Helper to extract query parameters
  const urlObj = new URL(url, 'http://dummy.local');
  const path = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  const makeResponse = (data, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
    request: {},
  });

  try {
    // ─── 1. JOBS ─────────────────────────────────────────────────────────────
    if (path === '/jobs' && method === 'get') {
      const jobs = await supabaseDb.getJobs();
      return makeResponse(jobs);
    }

    if (path.startsWith('/jobs/recruiter/') && method === 'get') {
      const recId = path.split('/')[3];
      const jobs = await supabaseDb.getJobsByRecruiter(recId);
      return makeResponse(jobs);
    }

    if (path.match(/^\/jobs\/\d+\/apply$/) && method === 'post') {
      const jobId = path.split('/')[2];
      const candId = searchParams.get('candidateId') || body.candidateId;
      const res = await supabaseDb.applyForJob({
        jobId,
        candidateId: candId,
        candidateName: body.candidateName,
        candidateEmail: body.candidateEmail,
        coverLetter: body.coverLetter,
        resumeUrl: body.resumeUrl,
      });
      return makeResponse(res, 201);
    }

    if (path.match(/^\/jobs\/\d+\/status$/) && method === 'put') {
      const jobId = path.split('/')[2];
      const res = await supabaseDb.toggleJobStatus(jobId);
      return makeResponse(res);
    }

    if (path.match(/^\/jobs\/\d+$/) && method === 'get') {
      const jobId = path.split('/')[2];
      const job = await supabaseDb.getJobById(jobId);
      return makeResponse(job);
    }

    if (path === '/jobs' && method === 'post') {
      const recruiterId = searchParams.get('recruiterId') || body.recruiterId;
      const job = await supabaseDb.createJob(body, recruiterId);
      return makeResponse(job, 201);
    }

    if (path.match(/^\/jobs\/\d+$/) && method === 'put') {
      const jobId = path.split('/')[2];
      const job = await supabaseDb.updateJob(jobId, body);
      return makeResponse(job);
    }

    if (path.match(/^\/jobs\/\d+$/) && method === 'delete') {
      const jobId = path.split('/')[2];
      const res = await supabaseDb.deleteJob(jobId);
      return makeResponse(res);
    }

    // ─── 2. APPLICATIONS ─────────────────────────────────────────────────────
    if (path.startsWith('/applications/candidate/') && method === 'get') {
      const candId = path.split('/')[3];
      const apps = await supabaseDb.getCandidateApplications(candId);
      return makeResponse(apps);
    }

    if (path.startsWith('/applications/job/') && method === 'get') {
      const jobId = path.split('/')[3];
      const allApps = await supabaseDb.getAllApplications();
      const filtered = allApps.filter(a => String(a.job_id) === String(jobId));
      return makeResponse(filtered);
    }

    if (path === '/applications' && method === 'get') {
      const apps = await supabaseDb.getAllApplications();
      return makeResponse(apps);
    }

    if (path.match(/^\/applications\/\d+\/status$/) && method === 'put') {
      const appId = path.split('/')[2];
      const res = await supabaseDb.updateApplicationStatus(appId, body.status);
      return makeResponse(res);
    }

    if (path === '/applications' && method === 'post') {
      const res = await supabaseDb.applyForJob({
        jobId: body.jobId,
        candidateId: body.candidateId,
        candidateName: body.candidateName,
        candidateEmail: body.candidateEmail,
        coverLetter: body.coverLetter,
        resumeUrl: body.resumeUrl,
      });
      return makeResponse(res, 201);
    }

    // ─── 3. SAVED JOBS ───────────────────────────────────────────────────────
    if (path.startsWith('/saved-jobs/candidate/') && method === 'get') {
      const candId = path.split('/')[3];
      const saved = await supabaseDb.getSavedJobs(candId);
      return makeResponse(saved);
    }

    if (path === '/saved-jobs' && method === 'post') {
      const res = await supabaseDb.saveJob(body.candidateId, body.jobId);
      return makeResponse(res, 201);
    }

    if (path.startsWith('/saved-jobs/') && method === 'delete') {
      const savedId = path.split('/')[2];
      const candId = searchParams.get('candidateId');
      const res = await supabaseDb.unsaveJob(candId, savedId);
      return makeResponse(res);
    }

    // ─── 4. INTERVIEWS ───────────────────────────────────────────────────────
    if (path.startsWith('/interviews/candidate/') && method === 'get') {
      const candId = path.split('/')[3];
      const interviews = await supabaseDb.getInterviews(candId, 'CANDIDATE');
      return makeResponse(interviews);
    }

    if (path.startsWith('/interviews/recruiter/') && method === 'get') {
      const recId = path.split('/')[3];
      const interviews = await supabaseDb.getInterviews(recId, 'RECRUITER');
      return makeResponse(interviews);
    }

    if (path === '/interviews' && method === 'post') {
      const interview = await supabaseDb.scheduleInterview(body);
      return makeResponse(interview, 201);
    }

    if (path.match(/^\/interviews\/\d+\/status$/) && method === 'put') {
      const id = path.split('/')[2];
      const res = await supabaseDb.updateInterviewStatus(id, body.status);
      return makeResponse(res);
    }

    // ─── 5. PROFILES ─────────────────────────────────────────────────────────
    if (path.startsWith('/candidates/') && path.endsWith('/profile') && method === 'get') {
      const candId = path.split('/')[2];
      const profile = await supabaseDb.getCandidateProfile(candId);
      return makeResponse(profile);
    }

    if (path.startsWith('/candidates/') && path.endsWith('/profile') && method === 'put') {
      const candId = path.split('/')[2];
      const profile = await supabaseDb.updateCandidateProfile(candId, body);
      return makeResponse(profile);
    }

    if (path.startsWith('/recruiters/') && path.endsWith('/profile') && method === 'get') {
      const recId = path.split('/')[2];
      const profile = await supabaseDb.getRecruiterProfile(recId);
      return makeResponse(profile);
    }

    if (path.startsWith('/recruiters/') && path.endsWith('/profile') && method === 'put') {
      const recId = path.split('/')[2];
      const profile = await supabaseDb.updateRecruiterProfile(recId, body);
      return makeResponse(profile);
    }

    if (path.startsWith('/recruiters/') && path.endsWith('/company') && method === 'put') {
      const recId = path.split('/')[2];
      const profile = await supabaseDb.updateRecruiterProfile(recId, {
        company_name: body.name || body.companyName,
        website: body.website,
      });
      return makeResponse(profile);
    }

    // ─── 6. NOTIFICATIONS ────────────────────────────────────────────────────
    if (path.startsWith('/notifications/user/') && path.endsWith('/read-all') && method === 'patch') {
      const userId = path.split('/')[3];
      await supabaseDb.markAllNotificationsRead(userId);
      return makeResponse({ success: true });
    }

    if (path.startsWith('/notifications/user/') && method === 'get') {
      const userId = path.split('/')[3];
      const notifs = await supabaseDb.getUserNotifications(userId);
      return makeResponse(notifs);
    }

    // ─── 7. SKILL MATCH (Edge Function) ──────────────────────────────────────
    if (path === '/skill-match' && method === 'get') {
      const candId = searchParams.get('candidateId');
      const jobId = searchParams.get('jobId');

      const candProfile = await supabaseDb.getCandidateProfile(candId);
      const job = await supabaseDb.getJobById(jobId);

      const evaluation = await supabaseDb.evaluateSkillMatch(
        candProfile?.skills || [],
        job?.requiredSkills || job?.skills || []
      );
      return makeResponse(evaluation);
    }

    // ─── 8. ADMIN & USERS ────────────────────────────────────────────────────
    if (path === '/admin/users' && method === 'get') {
      const users = await supabaseDb.getAllUsers();
      return makeResponse(users);
    }

    if (path.match(/^\/admin\/users\/[^/]+\/toggle-status$/) && method === 'patch') {
      const userId = path.split('/')[3];
      const res = await supabaseDb.toggleUserActive(userId, body.active);
      return makeResponse(res);
    }

    if (path.match(/^\/admin\/users\/[^/]+$/) && method === 'delete') {
      const userId = path.split('/')[3];
      const res = await supabaseDb.deleteUser(userId);
      return makeResponse(res);
    }

    // Unhandled paths fall back to the default adapter
    return defaultAdapter(config);
  } catch (err) {
    console.error('Supabase adapter request error on', method, path, err);
    return Promise.reject({
      response: {
        data: {
          error: err.message || 'Operation failed',
          message: err.message || 'Operation failed',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config,
      },
    });
  }
};

export default axiosClient;
