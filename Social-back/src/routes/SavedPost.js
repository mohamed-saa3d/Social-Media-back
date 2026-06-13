import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
  savePost,
  unsavePost,
  getSavedPosts,
} from '../controllers/savedPostController.js';

const router = express.Router();

router.post('/saved/:postId', requireAuth, asyncHandler(savePost));
router.delete('/saved/:postId', requireAuth, asyncHandler(unsavePost));
router.get('/saved', requireAuth, asyncHandler(getSavedPosts));

export default router;
