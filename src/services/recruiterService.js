import axiosClient from '../api/axiosClient';

/**
 * RecruiterService - Recruiter profile and company management
 */
export const recruiterService = {
  getProfile: async (userId) => {
    const response = await axiosClient.get(`/recruiters/${userId}/profile`);
    return response.data;
  },

  updateProfile: async (userId, profileData) => {
    const response = await axiosClient.put(`/recruiters/${userId}/profile`, profileData);
    return response.data;
  },

  getCompany: async (userId) => {
    const response = await axiosClient.get(`/recruiters/${userId}/company`);
    return response.data;
  },

  updateCompany: async (userId, companyData) => {
    const response = await axiosClient.put(`/recruiters/${userId}/company`, companyData);
    return response.data;
  },
};

export default recruiterService;
