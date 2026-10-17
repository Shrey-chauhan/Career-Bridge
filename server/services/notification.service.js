const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const { isConnected } = require('../config/db');

// In-memory fallback storage for Notifications
const memoryNotifications = new Map();

/**
 * Create a single notification document
 */
const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  entityType,
  entityId,
  metadata = {},
}) => {
  if (!recipientId || !type || !title || !message || !entityType || !entityId) {
    console.error('Invalid notification parameters:', { recipientId, type, title, entityType, entityId });
    return null;
  }

  const recipientIdStr = recipientId.toString();
  const entityIdStr = entityId.toString();

  if (isConnected()) {
    try {
      const notification = await Notification.create({
        recipientId,
        type,
        title,
        message,
        entityType,
        entityId,
        metadata,
        isRead: false,
        readAt: null,
      });
      return notification;
    } catch (err) {
      console.error('Error creating notification:', err.message);
      return null;
    }
  } else {
    // Memory Mode Fallback
    const notifId = 'mem_notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newNotif = {
      id: notifId,
      _id: notifId,
      recipientId: recipientIdStr,
      type,
      title,
      message,
      entityType,
      entityId: entityIdStr,
      metadata,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryNotifications.set(notifId, newNotif);
    return newNotif;
  }
};

/**
 * Create bulk notifications efficiently
 */
const createBulkNotifications = async (notificationsList = []) => {
  if (!Array.isArray(notificationsList) || notificationsList.length === 0) return [];

  if (isConnected()) {
    try {
      const inserted = await Notification.insertMany(
        notificationsList.map((item) => ({
          ...item,
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        { ordered: false }
      );
      return inserted;
    } catch (err) {
      console.error('Bulk notification insertion error:', err.message);
      return [];
    }
  } else {
    const createdList = [];
    for (const item of notificationsList) {
      const notifId = 'mem_notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const newNotif = {
        id: notifId,
        _id: notifId,
        recipientId: item.recipientId.toString(),
        type: item.type,
        title: item.title,
        message: item.message,
        entityType: item.entityType,
        entityId: item.entityId.toString(),
        metadata: item.metadata || {},
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryNotifications.set(notifId, newNotif);
      createdList.push(newNotif);
    }
    return createdList;
  }
};

/**
 * Get paginated notifications for logged in user
 */
const getUserNotifications = async (userId, queryParams = {}) => {
  const userIdStr = userId.toString();
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit, 10) || 10));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const filter = { recipientId: userId };
    if (queryParams.isRead !== undefined && queryParams.isRead !== '') {
      filter.isRead = queryParams.isRead === 'true' || queryParams.isRead === true;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    // Memory Mode
    let userNotifs = [];
    for (const n of memoryNotifications.values()) {
      if (n.recipientId.toString() === userIdStr) {
        if (queryParams.isRead !== undefined && queryParams.isRead !== '') {
          const expectedRead = queryParams.isRead === 'true' || queryParams.isRead === true;
          if (n.isRead !== expectedRead) continue;
        }
        userNotifs.push(n);
      }
    }

    userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = userNotifs.length;
    const paginated = userNotifs.slice(skip, skip + limit);

    return {
      notifications: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
};

/**
 * Get count of unread notifications for logged in user
 */
const getUnreadCount = async (userId) => {
  const userIdStr = userId.toString();

  if (isConnected()) {
    const count = await Notification.countDocuments({
      recipientId: userId,
      isRead: false,
    });
    return count;
  } else {
    let unreadCount = 0;
    for (const n of memoryNotifications.values()) {
      if (n.recipientId.toString() === userIdStr && !n.isRead) {
        unreadCount++;
      }
    }
    return unreadCount;
  }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (userId, notificationId) => {
  const userIdStr = userId.toString();

  if (isConnected()) {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.recipientId.toString() !== userIdStr) {
      throw new AppError('You are not authorized to access this notification', 403);
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    return notification;
  } else {
    const notif = memoryNotifications.get(notificationId);
    if (!notif) {
      throw new AppError('Notification not found', 404);
    }

    if (notif.recipientId.toString() !== userIdStr) {
      throw new AppError('You are not authorized to access this notification', 403);
    }

    notif.isRead = true;
    notif.readAt = new Date();
    notif.updatedAt = new Date();
    memoryNotifications.set(notificationId, notif);
    return notif;
  }
};

/**
 * Mark all notifications as read for logged in user
 */
const markAllAsRead = async (userId) => {
  const userIdStr = userId.toString();

  if (isConnected()) {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return { message: 'All notifications marked as read' };
  } else {
    for (const [id, n] of memoryNotifications.entries()) {
      if (n.recipientId.toString() === userIdStr && !n.isRead) {
        memoryNotifications.set(id, {
          ...n,
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    return { message: 'All notifications marked as read' };
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (userId, notificationId) => {
  const userIdStr = userId.toString();

  if (isConnected()) {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.recipientId.toString() !== userIdStr) {
      throw new AppError('You are not authorized to delete this notification', 403);
    }

    await Notification.findByIdAndDelete(notificationId);
    return { message: 'Notification deleted successfully' };
  } else {
    const notif = memoryNotifications.get(notificationId);
    if (!notif) {
      throw new AppError('Notification not found', 404);
    }

    if (notif.recipientId.toString() !== userIdStr) {
      throw new AppError('You are not authorized to delete this notification', 403);
    }

    memoryNotifications.delete(notificationId);
    return { message: 'Notification deleted successfully' };
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
