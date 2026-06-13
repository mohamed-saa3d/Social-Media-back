import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    likePost,
} from '../controllers/postController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createPostValidation, updatePostValidation } from '../validations/post.validation.js';
import { requireAuth } from '../middlewares/auth.js';
import { ownerOrAdmin } from '../middlewares/authorize.js';

const router = express.Router();

router.post('/', requireAuth, createPostValidation, validateRequest, asyncHandler(createPost));
router.get('/', asyncHandler(getPosts));
router.get('/:id', asyncHandler(getPostById));
router.post('/:id/like', requireAuth, asyncHandler(likePost));
router.put(
    '/:id',
    requireAuth,
    ownerOrAdmin('Post'),
    updatePostValidation,
    validateRequest,
    asyncHandler(updatePost),
);
router.delete(
    '/:id',
    requireAuth,
    ownerOrAdmin('Post'),
    asyncHandler(deletePost),
);

export default router;
