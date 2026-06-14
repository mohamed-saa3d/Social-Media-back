import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
  savePost,
  unsavePost,
  getSavedPosts,
} from '../controllers/savedPostController.js';

const router = express.Router();

router.post('/:postId', requireAuth, asyncHandler(savePost));
router.delete('/:postId', requireAuth, asyncHandler(unsavePost));
router.get('/', requireAuth, asyncHandler(getSavedPosts));

export default router;
