import axiosClient from '../api/axiosClient';
import { API_ENDPOINTS } from '../api/endpoints';

/**
 * aiService - Master Service for HireSphere Autonomous Agentic AI
 */
const aiService = {
  /**
   * Agent 1: Autonomous Candidate Screening
   */
  screenCandidate: async (candidateId, jobId) => {
    const response = await axiosClient.post(API_ENDPOINTS.AI.SCREEN, null, {
      params: { candidateId, jobId },
    });
    return response.data;
  },

  getAnalysesForJob: async (jobId) => {
    const response = await axiosClient.get(API_ENDPOINTS.AI.ANALYSES_BY_JOB(jobId));
    return response.data;
  },

  getAnalysesForCandidate: async (candidateId) => {
    const response = await axiosClient.get(API_ENDPOINTS.AI.ANALYSES_BY_CANDIDATE(candidateId));
    return response.data;
  },

  /**
   * Agent 2: Interactive AI Mock Interviewer & Coach
   */
  startInterviewSession: async (candidateId, jobRole) => {
    const response = await axiosClient.post(API_ENDPOINTS.AI.INTERVIEW_START, null, {
      params: { candidateId, jobRole },
    });
    return response.data;
  },

  sendInterviewMessage: async (payload) => {
    const response = await axiosClient.post(API_ENDPOINTS.AI.INTERVIEW_MESSAGE, payload);
    return response.data;
  },

  getSessionTranscript: async (sessionId) => {
    const response = await axiosClient.get(API_ENDPOINTS.AI.INTERVIEW_TRANSCRIPT(sessionId));
    return response.data;
  },

  /**
   * Agent 3: AI Job Description Generator
   */
  generateJobSpec: async (jobData) => {
    const response = await axiosClient.post(API_ENDPOINTS.AI.GENERATE_JOB, jobData);
    return response.data;
  },
};

export default aiService;
