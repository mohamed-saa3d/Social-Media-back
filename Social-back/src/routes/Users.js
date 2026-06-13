import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
  registerUser,
  loginUser,
  getUserById,
  getMyProfile,
  updateUser,
  logoutUser,
  deleteUser,
  followUser,
} from '../controllers/userController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { registerValidation, loginValidation, updateUserValidation } from '../validations/user.validation.js';
import { requireAuth } from '../middlewares/auth.js';
import { ownerOrAdmin } from '../middlewares/authorize.js';
import { loginLimiter, registerLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, registerValidation, validateRequest, asyncHandler(registerUser));
router.post('/login', loginLimiter, loginValidation, validateRequest, asyncHandler(loginUser));
router.post('/logout', asyncHandler(logoutUser));
router.get('/my-profile', requireAuth, asyncHandler(getMyProfile));
router.get('/:id', asyncHandler(getUserById));
router.post('/:id/follow', requireAuth, asyncHandler(followUser));
router.put('/:id', requireAuth, ownerOrAdmin('User'), updateUserValidation, validateRequest, asyncHandler(updateUser));
router.delete('/:id', requireAuth, ownerOrAdmin('User'), asyncHandler(deleteUser));

export default router;
