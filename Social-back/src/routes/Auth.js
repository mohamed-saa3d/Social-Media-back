import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import validateRequest from '../middlewares/validateRequest.js';
import { requireAuth } from '../middlewares/auth.js';
import { passwordChangeLimiter } from '../middlewares/rateLimiter.js';
import {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  logoutUser,
} from '../controllers/authController.js';
import { changePasswordValidation } from '../validations/auth.validation.js';
import { registerValidation, loginValidation } from '../validations/user.validation.js';

const router = express.Router();

router.post('/register', registerValidation, validateRequest, asyncHandler(registerUser));
router.post('/login', loginValidation, validateRequest, asyncHandler(loginUser));
router.post('/refresh', asyncHandler(refreshToken));
router.post('/logout', asyncHandler(logoutUser));
router.patch('/change-password', passwordChangeLimiter, requireAuth, changePasswordValidation, validateRequest, asyncHandler(changePassword));

export default router;
