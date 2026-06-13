import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('BlacklistedToken', blacklistedTokenSchema);
