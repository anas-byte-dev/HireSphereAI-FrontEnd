import axiosClient from '../api/axiosClient';

/**
 * SavedJobService - Candidate bookmarks and saved jobs operations
 */
export const savedJobService = {
  saveJob: async (candidateId, jobId) => {
    const response = await axiosClient.post('/saved-jobs', { candidateId, jobId });
    return response.data;
  },

  getSavedJobs: async (candidateId) => {
    const response = await axiosClient.get(`/saved-jobs/candidate/${candidateId}`);
    return response.data;
  },

  checkIfSaved: async (candidateId, jobId) => {
    const response = await axiosClient.get(`/saved-jobs/check?candidateId=${candidateId}&jobId=${jobId}`);
    return response.data;
  },

  removeSavedJob: async (savedJobId, candidateId) => {
    const response = await axiosClient.delete(`/saved-jobs/${savedJobId}?candidateId=${candidateId}`);
    return response.data;
  },
};

export default savedJobService;
