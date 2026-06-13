import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import validateRequest from '../middlewares/validateRequest.js';
import { createComment, getCommentsByPost, getCommentById, updateComment, deleteComment } from '../controllers/commentController.js';
import { createCommentValidation, updateCommentValidation } from '../validations/comment.validation.js';
import { requireAuth } from '../middlewares/auth.js';
import { ownerOrAdmin } from '../middlewares/authorize.js';

const router = express.Router();

router.post('/', requireAuth, createCommentValidation, validateRequest, asyncHandler(createComment));
router.get('/post/:postId', asyncHandler(getCommentsByPost));
router.get('/:id', asyncHandler(getCommentById));
router.put(
    '/:id',
    requireAuth,
    ownerOrAdmin('Comment'),
    updateCommentValidation,
    validateRequest,
    asyncHandler(updateComment),
);
router.delete(
    '/:id',
    requireAuth,
    ownerOrAdmin('Comment'),
    asyncHandler(deleteComment),
);

export default router;
