import express from 'express';
// import { requireAuth } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import { sendOtp, verifyOtp } from '../controllers/otpController.js';
import { verifyEmail, resendVerification } from '../controllers/otpController.js';

const router = express.Router();

router.post('/send', asyncHandler(sendOtp));
router.post('/verify', asyncHandler(verifyOtp));

// Public endpoints for email verification during registration
router.post('/verify-email', asyncHandler(verifyEmail));
router.post('/resend-verification', asyncHandler(resendVerification));
export default router;
