import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/notifications/user/${user.id}`);
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosClient.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axiosClient.patch(`/notifications/user/${user.id}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setMessage({ type: 'success', text: 'All notifications marked as read.' });
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="section-container">
      <div className="dashboard-header-flex">
        <div>
          <h1>Notifications</h1>
          <p className="subtitle">System alerts, application updates, and interview notices.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ margin: '1rem 0' }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="loading-state">Loading your notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="empty-card">
          <h3>No notifications</h3>
          <p>You are all caught up! Updates about applications and interviews will appear here.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`notification-card ${item.read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {item.read ? '✉️' : '📩'}
              </div>
              <div className="notification-content">
                <p className="notification-text">{item.message}</p>
                <span className="notification-date">{item.date || 'Recent'}</span>
              </div>
              <div className="notification-actions">
                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="btn btn-outline btn-sm"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
