import axiosClient from '../api/axiosClient';

/**
 * AuthService - Authentication API operations
 */
export const authService = {
  login: async (email, password) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post('/auth/logout');
    return response.data;
  },

  validateSession: async () => {
    const response = await axiosClient.get('/auth/validate');
    return response.data;
  },
};

export default authService;
