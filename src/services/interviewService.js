import axiosClient from '../api/axiosClient';

/**
 * InterviewService - Interview booking and tracking operations
 */
export const interviewService = {
  scheduleInterview: async (interviewData) => {
    const response = await axiosClient.post('/interviews', interviewData);
    return response.data;
  },

  getCandidateInterviews: async (candidateId) => {
    const response = await axiosClient.get(`/interviews/candidate/${candidateId}`);
    return response.data;
  },

  getRecruiterInterviews: async (recruiterId) => {
    const response = await axiosClient.get(`/interviews/recruiter/${recruiterId}`);
    return response.data;
  },

  updateInterview: async (interviewId, updateData) => {
    const response = await axiosClient.put(`/interviews/${interviewId}`, updateData);
    return response.data;
  },
};

export default interviewService;
