import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  codeHash: {
    type: String,
    required: true,
    trim: true,
    min_length: 32,
    max_length: 255,
  },
  type: {
    type: String,
    enum: ['email_verify', 'password_reset', '2fa'],
    required: true,
    index: true,
    trim: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  usedAt: {
    type: Date,
    default: null,
    index: true,
  },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ userId: 1, type: 1, createdAt: -1 });
otpSchema.index({ userId: 1, type: 1, usedAt: 1, expiresAt: 1 });
otpSchema.index({ userId: 1, type: 1, usedAt: 1, createdAt: -1 });

export default mongoose.model('OTP', otpSchema);
