import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  deviceInfo: {
    type: String,
    default: 'Unknown',
  },
  ipAddress: {
    type: String,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
