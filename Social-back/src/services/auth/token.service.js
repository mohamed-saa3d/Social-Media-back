import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshToken from '../../models/RefreshToken.js';
import config from '../../config.js';
import { AppError } from '../../utils/appError.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000;

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const signAccessToken = (userId) => (
  jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
);

export const signRefreshToken = (userId) => (
  jwt.sign({ id: userId, typ: 'refresh' }, config.JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL })
);

export const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, config.JWT_SECRET);
  if (!payload?.id) {
    throw new AppError(401, { message: 'Unauthorized' });
  }

  return payload;
};

export const verifyRefreshToken = (refreshToken) => {
  const payload = jwt.verify(refreshToken, config.JWT_SECRET);
  if (!payload?.id || payload?.typ !== 'refresh') {
    throw new AppError(401, { message: 'Invalid refresh token' });
  }

  return payload;
};

export const buildRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: REFRESH_TOKEN_MS,
});

export const getRefreshTokenExpiresAt = () => new Date(Date.now() + REFRESH_TOKEN_MS);

export const storeRefreshToken = async ({ userId, refreshToken, requestMeta = {} }) => {
  const token = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiresAt();

  const record = await RefreshToken.create({
    userId,
    token,
    deviceInfo: requestMeta.deviceInfo || 'Unknown',
    ipAddress: requestMeta.ipAddress,
    expiresAt,
  });

  return record;
};

export const findActiveRefreshTokenRecord = async (refreshToken) => {
  const token = hashToken(refreshToken);
  return RefreshToken.findOne({
    token,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
};

export const findRefreshTokenRecordByHash = async (tokenHash) => {
  return RefreshToken.findOne({ token: tokenHash });
};

export const revokeRefreshTokenRecord = async (refreshToken) => {
  const record = await findActiveRefreshTokenRecord(refreshToken);
  if (!record) {
    return null;
  }

  record.revokedAt = new Date();
  await record.save();
  return record;
};

export const revokeAllRefreshTokensForUser = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};

export default {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  buildRefreshCookieOptions,
  getRefreshTokenExpiresAt,
  storeRefreshToken,
  findActiveRefreshTokenRecord,
  findRefreshTokenRecordByHash,
  revokeRefreshTokenRecord,
  revokeAllRefreshTokensForUser,
};
