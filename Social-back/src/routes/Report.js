import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { adminOnly } from '../middlewares/authorize.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
  createReport,
  updateReportStatus,
  listReports,
} from '../controllers/reportController.js';

const router = express.Router();

router.post('/report', requireAuth, asyncHandler(createReport));
router.get('/reports', requireAuth, adminOnly, asyncHandler(listReports));
router.patch('/report/:id/status', requireAuth, adminOnly, asyncHandler(updateReportStatus));

export default router;
