import axiosClient from '../api/axiosClient';

/**
 * JobService - Job management and search operations
 */
export const jobService = {
  getAllJobs: async () => {
    const response = await axiosClient.get('/jobs');
    return response.data;
  },

  getJobById: async (jobId) => {
    const response = await axiosClient.get(`/jobs/${jobId}`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await axiosClient.post('/jobs', jobData);
    return response.data;
  },

  updateJob: async (jobId, jobData) => {
    const response = await axiosClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  deleteJob: async (jobId, recruiterId) => {
    const url = recruiterId ? `/jobs/${jobId}?recruiterId=${recruiterId}` : `/jobs/${jobId}`;
    const response = await axiosClient.delete(url);
    return response.data;
  },

  toggleJobStatus: async (jobId, recruiterId) => {
    const url = recruiterId ? `/jobs/${jobId}/status?recruiterId=${recruiterId}` : `/jobs/${jobId}/status`;
    const response = await axiosClient.put(url);
    return response.data;
  },

  getJobsByRecruiter: async (recruiterId) => {
    const response = await axiosClient.get(`/jobs/recruiter/${recruiterId}`);
    return response.data;
  },
};

export default jobService;
