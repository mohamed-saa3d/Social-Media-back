import mongoose from 'mongoose';

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

export const OTP_TYPES = ['email_verify', 'password_reset', '2fa'];

export const validateOtpExpiresAt = (expiresAt, createdAt) => {
  if (!expiresAt || !createdAt) {
    return true;
  }

  return expiresAt > createdAt;
};

