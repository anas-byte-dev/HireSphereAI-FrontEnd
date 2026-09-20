import axiosClient from '../api/axiosClient';

/**
 * NotificationService - User notifications and alerts operations
 */
export const notificationService = {
  getUserNotifications: async (userId) => {
    const response = await axiosClient.get(`/notifications/user/${userId}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await axiosClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (userId) => {
    const response = await axiosClient.put(`/notifications/user/${userId}/read-all`);
    return response.data;
  },
};

export default notificationService;
