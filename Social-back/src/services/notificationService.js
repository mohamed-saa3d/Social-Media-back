import Notification from '../models/Notification.js';
import { AppError } from '../utils/appError.js';

const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

export const getNotificationsForUser = async ({ requestedUserId, currentUserId, query = {} }) => {
  if (requestedUserId !== currentUserId) {
    throw new AppError(403, { error: 'Forbidden' });
  }

  const { page, limit, skip } = getPagination(query);
  const filter = { recipient: currentUserId };
  const [totalCount, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return {
    data: notifications,
    page,
    totalPages: Math.ceil(totalCount / limit) || 1,
    totalCount,
  };
};

export const markNotificationRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError(404, { error: 'Notification not found' });
  }

  if (notification.recipient.toString() !== userId) {
    throw new AppError(403, { error: 'Forbidden' });
  }

  notification.read = true;
  const updated = await notification.save();
  return updated;
};

export const deleteNotification = async ({ notificationId, userId }) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError(404, { error: 'Notification not found' });
  }

  if (notification.recipient.toString() !== userId) {
    throw new AppError(403, { error: 'Forbidden' });
  }

  await notification.deleteOne();
  return { message: 'Deleted' };
};

export default {
  getNotificationsForUser,
  markNotificationRead,
  deleteNotification,
};
