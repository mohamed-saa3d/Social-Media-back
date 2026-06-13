import express from 'express';
import multer from 'multer';
import asyncHandler from '../middlewares/asyncHandler.js';
import { uploadMedia } from '../controllers/mediaController.js';
import { requireAuth } from '../middlewares/auth.js';

// Use memory storage so we can validate magic-bytes before persisting to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), asyncHandler(uploadMedia));

export default router;
