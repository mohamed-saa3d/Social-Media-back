import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendOtp, verifyOtp } from '../controllers/otpController.js';

const router = express.Router();

router.post('/otp/send', requireAuth, asyncHandler(sendOtp));
router.post('/otp/verify', requireAuth, asyncHandler(verifyOtp));

export default router;
