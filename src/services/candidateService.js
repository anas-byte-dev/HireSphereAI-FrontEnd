import axiosClient from '../api/axiosClient';

/**
 * CandidateService - Candidate profile and skill management
 */
export const candidateService = {
  getProfile: async (userId) => {
    const response = await axiosClient.get(`/candidates/${userId}/profile`);
    return response.data;
  },

  updateProfile: async (userId, profileData) => {
    const response = await axiosClient.put(`/candidates/${userId}/profile`, profileData);
    return response.data;
  },
};

export default candidateService;
