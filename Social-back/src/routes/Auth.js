import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import validateRequest from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/auth.js';
import { passwordChangeLimiter } from '../middlewares/rateLimiter.js';
import { changePassword } from '../controllers/authController.js';
import { changePasswordValidation } from '../validations/auth.validation.js';

const router = express.Router();

router.patch('/change-password', passwordChangeLimiter, requireAuth, changePasswordValidation, validateRequest, asyncHandler(changePassword));

export default router;
