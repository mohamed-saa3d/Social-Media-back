import express from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { deleteUserAdmin, deletePostAdmin, viewStats, demoteAdmin } from '../controllers/adminController.js';
import { requireAuth } from '../middlewares/auth.js';
import { adminOnly } from '../middlewares/authorize.js';

const router = express.Router();

// protect admin routes
router.delete('/users/:id', requireAuth, adminOnly, asyncHandler(deleteUserAdmin));
router.patch('/users/:id/demote', requireAuth, adminOnly, asyncHandler(demoteAdmin));
router.delete('/posts/:id', requireAuth, adminOnly, asyncHandler(deletePostAdmin));
router.get('/stats', requireAuth, adminOnly, asyncHandler(viewStats));

export default router;
