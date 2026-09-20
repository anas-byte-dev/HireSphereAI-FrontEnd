import axiosClient from '../api/axiosClient';

/**
 * AdminService - System administration and platform metrics
 */
export const adminService = {
  getStats: async () => {
    const response = await axiosClient.get('/admin/stats');
    return response.data;
  },

  getAllUsers: async (role) => {
    const url = role && role !== 'ALL' ? `/admin/users?role=${role}` : '/admin/users';
    const response = await axiosClient.get(url);
    return response.data;
  },

  getAllJobs: async () => {
    const response = await axiosClient.get('/admin/jobs');
    return response.data;
  },

  getAllApplications: async () => {
    const response = await axiosClient.get('/admin/applications');
    return response.data;
  },

  toggleUserStatus: async (userId, adminId) => {
    const response = await axiosClient.put(`/admin/users/${userId}/toggle-status?adminId=${adminId}`);
    return response.data;
  },

  toggleJobStatus: async (jobId, adminId) => {
    const response = await axiosClient.put(`/admin/jobs/${jobId}/toggle-status?adminId=${adminId}`);
    return response.data;
  },
};

export default adminService;
