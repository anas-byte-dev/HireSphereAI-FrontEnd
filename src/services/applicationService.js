import axiosClient from '../api/axiosClient';

/**
 * ApplicationService - Job application lifecycle operations
 */
export const applicationService = {
  applyForJob: async (applicationData) => {
    const response = await axiosClient.post('/applications', applicationData);
    return response.data;
  },

  getCandidateApplications: async (candidateId) => {
    const response = await axiosClient.get(`/applications/candidate/${candidateId}`);
    return response.data;
  },

  getJobApplicants: async (jobId, recruiterId) => {
    const url = recruiterId ? `/applications/job/${jobId}?recruiterId=${recruiterId}` : `/applications/job/${jobId}`;
    const response = await axiosClient.get(url);
    return response.data;
  },

  updateApplicationStatus: async (applicationId, status, recruiterId) => {
    const url = recruiterId
      ? `/applications/${applicationId}/status?recruiterId=${recruiterId}`
      : `/applications/${applicationId}/status`;
    const response = await axiosClient.put(url, { status });
    return response.data;
  },
};

export default applicationService;
