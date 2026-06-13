import Session from './session.model.js';
import { AppError } from '../../utils/appError.js';
import tokenService from '../../services/auth/token.service.js';

const buildDeviceFingerprint = ({ userId, deviceInfo = 'Unknown', ipAddress = '' }) => {
  return tokenService.hashToken(`${userId}:${deviceInfo}:${ipAddress}`);
};

export const recordSessionActivity = async ({ userId, requestMeta = {} }) => {
  const deviceInfo = requestMeta.deviceInfo || 'Unknown';
  const ipAddress = requestMeta.ipAddress || '';
  const deviceFingerprint = buildDeviceFingerprint({ userId, deviceInfo, ipAddress });

  return Session.findOneAndUpdate(
    { userId, deviceFingerprint },
    {
      $set: {
        deviceInfo,
        ipAddress,
        isActive: true,
        revokedAt: null,
        lastSeenAt: new Date(),
      },
      $setOnInsert: { userId, deviceFingerprint },
    },
    { new: true, upsert: true },
  );
};

export const listActiveSessions = async (userId) => {
  const sessions = await Session.find({
    userId,
    isActive: true,
    revokedAt: null,
  }).select('_id deviceInfo ipAddress createdAt updatedAt lastSeenAt');

  return sessions.map((session) => ({
    id: session._id,
    deviceInfo: session.deviceInfo,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    lastSeenAt: session.lastSeenAt,
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

  session.isActive = false;
  session.revokedAt = new Date();
  await session.save();

  return { message: 'Session revoked successfully' };
};

export const revokeCurrentDeviceSession = async ({ userId, requestMeta = {} }) => {
  const deviceInfo = requestMeta.deviceInfo || 'Unknown';
  const ipAddress = requestMeta.ipAddress || '';
  const deviceFingerprint = buildDeviceFingerprint({ userId, deviceInfo, ipAddress });

  await Session.findOneAndUpdate(
    { userId, deviceFingerprint, isActive: true },
    { $set: { isActive: false, revokedAt: new Date() } },
  );
};

export const revokeAllOtherSessions = async ({ userId, requestMeta = {} }) => {
  const deviceInfo = requestMeta.deviceInfo || 'Unknown';
  const ipAddress = requestMeta.ipAddress || '';
  const deviceFingerprint = buildDeviceFingerprint({ userId, deviceInfo, ipAddress });

  await Session.updateMany(
    { userId, deviceFingerprint: { $ne: deviceFingerprint }, isActive: true },
    { $set: { isActive: false, revokedAt: new Date() } },
  );

  return { message: 'All other sessions revoked successfully' };
};

export default {
  recordSessionActivity,
  listActiveSessions,
  revokeSessionById,
  revokeCurrentDeviceSession,
  revokeAllOtherSessions,
};
