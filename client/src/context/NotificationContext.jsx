import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getUnreadCountApi,
  getNotificationsApi,
  markAsReadApi,
  markAllAsReadApi,
  deleteNotificationApi,
} from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingDropdown, setLoadingDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      // 30-second periodic background polling
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setRecentNotifications([]);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCountApi();
      if (res.success && res.data) {
        setUnreadCount(res.data.count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  };

  const fetchRecentNotifications = async () => {
    setLoadingDropdown(true);
    try {
      const res = await getNotificationsApi({ page: 1, limit: 10 });
      if (res.success && Array.isArray(res.data)) {
        setRecentNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
    } finally {
      setLoadingDropdown(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const res = await markAsReadApi(notificationId);
      if (res.success) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setRecentNotifications((prev) =>
          prev.map((n) =>
            (n._id || n.id) === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          )
        );
      }
      return res;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await markAllAsReadApi();
      if (res.success) {
        setUnreadCount(0);
        setRecentNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
        );
      }
      return res;
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const res = await deleteNotificationApi(notificationId);
      if (res.success) {
        setRecentNotifications((prev) =>
          prev.filter((n) => (n._id || n.id) !== notificationId)
        );
        fetchUnreadCount();
      }
      return res;
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        recentNotifications,
        loadingDropdown,
        fetchUnreadCount,
        fetchRecentNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
