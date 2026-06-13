import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';
import { AppError } from '../utils/appError.js';
import { OTP_TYPES, validateOtpExpiresAt } from '../validations/otp.validation.js';

const DEFAULT_OTP_TTL_MS = 10 * 60 * 1000;
const OTP_LENGTH = 6;
const OTP_HASH_ROUNDS = 10;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ACTIVE_PER_TYPE = 3;

const generateNumericCode = (length = OTP_LENGTH) => {
  const min = 10 ** (length - 1);
  const max = (10 ** length) - 1;
  return String(crypto.randomInt(min, max + 1));
};

const hashOtpCode = async (code) => bcrypt.hash(String(code), OTP_HASH_ROUNDS);

const normalizeType = (type) => {
  if (!OTP_TYPES.includes(type)) {
    throw new AppError(400, { error: 'Invalid OTP type' });
  }
  return type;
};

const getExpiryFromNow = (ttlMs = DEFAULT_OTP_TTL_MS) => new Date(Date.now() + ttlMs);

const getLatestOtp = async ({ userId, type }) => (
  OTP.findOne({ userId, type }).sort({ createdAt: -1 })
);

export const generateOTP = async ({ userId, type, ttlMs = DEFAULT_OTP_TTL_MS }) => {
  const normalizedType = normalizeType(type);
  const code = generateNumericCode();
  const expiresAt = getExpiryFromNow(ttlMs);
  const codeHash = await hashOtpCode(code);

  const recentActiveCount = await OTP.countDocuments({
    userId,
    type: normalizedType,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (recentActiveCount >= OTP_MAX_ACTIVE_PER_TYPE) {
    throw new AppError(429, { error: 'Too many active OTPs' });
  }

  const otp = await OTP.create({
    userId,
    type: normalizedType,
    codeHash,
    expiresAt,
    usedAt: null,
  });

  return {
    otp,
    code,
    expiresAt,
  };
};

export const verifyOTP = async ({ userId, type, code }) => {
  const normalizedType = normalizeType(type);
  const otp = await OTP.findOne({
    userId,
    type: normalizedType,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp) {
    throw new AppError(400, { error: 'OTP is invalid or expired' });
  }

  const isMatch = await bcrypt.compare(String(code), otp.codeHash);
  if (!isMatch) {
    throw new AppError(400, { error: 'OTP is invalid or expired' });
  }

  otp.usedAt = new Date();
  await otp.save();

  return {
    verified: true,
    otp,
  };
};

export const expireOTP = async ({ otpId }) => {
  const otp = await OTP.findById(otpId);
  if (!otp) {
    throw new AppError(404, { error: 'OTP not found' });
  }

  if (!otp.usedAt) {
    otp.usedAt = new Date();
    await otp.save();
  }

  return otp;
};

export const resendOTP = async ({ userId, type, ttlMs = DEFAULT_OTP_TTL_MS }) => {
  const normalizedType = normalizeType(type);
  const latestOtp = await getLatestOtp({ userId, type: normalizedType });

  if (latestOtp) {
    const now = Date.now();
    const createdAtMs = new Date(latestOtp.createdAt).getTime();
    if (now - createdAtMs < OTP_RESEND_COOLDOWN_MS && latestOtp.usedAt === null) {
      throw new AppError(429, { error: 'Please wait before requesting another OTP' });
    }
  }

  await OTP.updateMany(
    { userId, type: normalizedType, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  );

  const code = generateNumericCode();
  const expiresAt = getExpiryFromNow(ttlMs);
  const codeHash = await hashOtpCode(code);

  const otp = await OTP.create({
    userId,
    type: normalizedType,
    codeHash,
    expiresAt,
    usedAt: null,
  });

  if (!validateOtpExpiresAt(otp.expiresAt, otp.createdAt)) {
    throw new AppError(500, { error: 'Invalid OTP expiration' });
  }

  return {
    otp,
    code,
    expiresAt,
  };
};

export default {
  generateOTP,
  verifyOTP,
  expireOTP,
  resendOTP,
};
