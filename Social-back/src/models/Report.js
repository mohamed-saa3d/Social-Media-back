import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  targetType: {
    type: String,
    enum: ['post', 'user', 'comment'],
    required: true,
    index: true,
    trim: true,
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'nudity',
      'violence',
      'scam',
      'impersonation',
      'copyright',
      'self_harm',
      'other',
    ],
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: null,
    trim: true,
    maxlength: 5000,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
    index: true,
  },
}, { timestamps: true });

reportSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1, targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model('Report', reportSchema);
