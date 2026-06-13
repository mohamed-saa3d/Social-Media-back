import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { getNotificationsForUser, markNotificationRead, deleteNotification } from '../controllers/notificationController.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();

router.get('/user/:userId', requireAuth, asyncHandler(getNotificationsForUser));
router.patch('/:id/read', requireAuth, asyncHandler(markNotificationRead));
router.delete('/:id', requireAuth, asyncHandler(deleteNotification));

export default router;
