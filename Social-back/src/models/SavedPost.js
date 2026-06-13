import mongoose from 'mongoose';

const savedPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  },
}, { timestamps: true });

savedPostSchema.index({ userId: 1, postId: 1 }, { unique: true });
savedPostSchema.index({ userId: 1, createdAt: -1 });
savedPostSchema.index({ postId: 1, createdAt: -1 });

export default mongoose.model('SavedPost', savedPostSchema);
