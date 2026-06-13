import sessionService from '../../modules/session/sessionService.js';

export const buildSessionMeta = (requestMeta = {}) => ({
  deviceInfo: requestMeta.deviceInfo || 'Unknown',
  ipAddress: requestMeta.ipAddress || '',
});

export const recordAuthSession = async ({ userId, requestMeta = {} }) => {
  return sessionService.recordSessionActivity({
    userId,
    requestMeta: buildSessionMeta(requestMeta),
  });
};

export const revokeAuthSession = async ({ userId, requestMeta = {} }) => {
  return sessionService.revokeCurrentDeviceSession({
    userId,
    requestMeta: buildSessionMeta(requestMeta),
  });
};

export default {
  buildSessionMeta,
  recordAuthSession,
  revokeAuthSession,
};
