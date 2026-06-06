import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import config from '../config.js';
import { AppError } from '../utils/appError.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const issueAccessToken = (userId, sessionId) => {
  return jwt.sign({ id: userId, sid: sessionId }, config.JWT_SECRET, { expiresIn: '15m' });
};

export const buildRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: THIRTY_DAYS_MS,
});

export const createSessionTokens = async (userId, requestMeta = {}) => {
  const refreshToken = jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: '30d' });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);

  const session = await Session.create({
    userId,
    tokenHash,
    deviceInfo: requestMeta.deviceInfo || 'Unknown',
    ipAddress: requestMeta.ipAddress,
    expiresAt,
  });

  const accessToken = issueAccessToken(userId, session._id.toString());

  return {
    accessToken,
    refreshToken,
    session,
    cookieOptions: buildRefreshCookieOptions(),
  };
};

export const validateSessionById = async (sessionId) => {
  if (!sessionId) return null;

  const session = await Session.findById(sessionId);
  if (!session) return null;
  if (session.isRevoked) return null;
  if (!session.expiresAt || session.expiresAt <= new Date()) return null;

  return session;
};

export const listActiveSessions = async (userId) => {
  const now = new Date();
  const sessions = await Session.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: now },
  }).select('_id deviceInfo ipAddress createdAt expiresAt');

  return sessions.map((session) => ({
    id: session._id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }));
};

export const revokeSessionById = async (sessionId, userId) => {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new AppError(404, { message: 'Session not found' });
  }

  if (session.userId.toString() !== userId.toString()) {
    throw new AppError(403, { message: 'Forbidden' });
  }

  session.isRevoked = true;
  await session.save();

  return { message: 'Session revoked successfully' };
};

export const revokeAllOtherSessions = async (userId, currentSessionId) => {
  if (!currentSessionId) {
    return { message: 'All other sessions revoked successfully' };
  }

  await Session.updateMany(
    { userId, _id: { $ne: currentSessionId } },
    { $set: { isRevoked: true } },
  );

  return { message: 'All other sessions revoked successfully' };
};

export const revokeAllOtherSessionsFromRefreshToken = async (userId, refreshToken) => {
  if (!refreshToken) {
    throw new AppError(400, { message: 'Refresh token is required' });
  }

  const tokenHash = hashToken(refreshToken);
  const currentSession = await Session.findOne({
    userId,
    tokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select('_id');

  if (!currentSession) {
    throw new AppError(401, { message: 'Session expired, please login again' });
  }

  return revokeAllOtherSessions(userId, currentSession._id);
};

export const revokeSessionByRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);
  await Session.findOneAndUpdate(
    { tokenHash, isRevoked: false },
    { $set: { isRevoked: true } },
  );
};

export const revokeSessionByAccessToken = async (accessToken) => {
  if (!accessToken) return;

  try {
    const payload = jwt.verify(accessToken, config.JWT_SECRET);
    const sessionId = payload?.sid;
    if (!sessionId) return;

    await Session.findByIdAndUpdate(sessionId, { $set: { isRevoked: true } });
  } catch (error) {
    // best-effort logout: ignore invalid access tokens
  }
};

export default {
  issueAccessToken,
  createSessionTokens,
  validateSessionById,
  listActiveSessions,
  revokeSessionById,
  revokeAllOtherSessions,
  revokeAllOtherSessionsFromRefreshToken,
  revokeSessionByRefreshToken,
  revokeSessionByAccessToken,
  buildRefreshCookieOptions,
};
