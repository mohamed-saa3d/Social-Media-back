import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../controllers/followController.js';

const router = express.Router();

router.post('/:userId', requireAuth, asyncHandler(followUser));
router.delete('/:userId', requireAuth, asyncHandler(unfollowUser));
router.get('/followers/:userId', asyncHandler(getFollowers));
router.get('/following/:userId', asyncHandler(getFollowing));

export default router;
