import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/auth.js';
import { getMySessions, revokeSession, revokeAllSessions } from '../controllers/sessionController.js';

const router = express.Router();

router.get('/', requireAuth, asyncHandler(getMySessions));
router.delete('/:id', requireAuth, asyncHandler(revokeSession));
router.delete('/', requireAuth, asyncHandler(revokeAllSessions));

export default router;

/*
 وجود Session model منفصل + sessionController
  يعني دعم متعدد الأجهزة (multi-device sessions).
*/
