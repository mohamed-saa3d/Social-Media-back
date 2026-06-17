import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import validateRequest from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/auth.js';

import {
  passwordChangeLimiter,
  registerLimiter,
  loginLimiter,
} from '../middlewares/rateLimiter.js';

import {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  logoutUser,
} from '../controllers/authController.js';

import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
} from '../validations/auth/index.js';

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  registerValidation,
  validateRequest,
  asyncHandler(registerUser)
);

router.post(
  '/login',
  loginLimiter,
  loginValidation,
  validateRequest,
  asyncHandler(loginUser)
);

router.post(
  '/refresh',
  asyncHandler(refreshToken)
);

router.post(
  '/logout',
  asyncHandler(logoutUser)
);

router.patch(
  '/change-password',
  requireAuth,
  passwordChangeLimiter,
  changePasswordValidation,
  validateRequest,
  asyncHandler(changePassword)
);

export default router;