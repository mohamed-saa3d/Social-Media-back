import notificationService from '../src/services/notificationService.js';
import handleServiceError from '../src/utils/handleServiceError.js';

export const getNotificationsForUser = async (req, res) => {
  try {
    const response = await notificationService.getNotificationsForUser({
      requestedUserId: req.params.userId,
      currentUserId: req.userId,
      query: req.query,
    });

    return res.status(200).json(response);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await notificationService.markNotificationRead({
      notificationId: req.params.id,
      userId: req.userId,
    });
    return res.status(200).json(notification);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const result = await notificationService.deleteNotification({
      notificationId: req.params.id,
      userId: req.userId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
