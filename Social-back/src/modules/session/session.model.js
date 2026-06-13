import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  deviceFingerprint: {
    type: String,
    required: true,
    index: true,
  },
  deviceInfo: {
    type: String,
    default: 'Unknown',
  },
  ipAddress: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

sessionSchema.index({ userId: 1, deviceFingerprint: 1 });
sessionSchema.index({ userId: 1, isActive: 1, lastSeenAt: -1 });

export default mongoose.model('Session', sessionSchema);
