import sessionService from './sessionService.js';
import handleServiceError from '../../utils/handleServiceError.js';

const getRequestMeta = (req) => ({
  deviceInfo: req.headers['user-agent'] || 'Unknown',
  ipAddress: req.ip,
});

export const getMySessions = async (req, res) => {
  try {
    const sessions = await sessionService.listActiveSessions(req.userId);
    return res.status(200).json(sessions);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const revokeSession = async (req, res) => {
  try {
    const result = await sessionService.revokeSessionById(req.params.id, req.userId);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const revokeAllSessions = async (req, res) => {
  try {
    const result = await sessionService.revokeAllOtherSessions({
      userId: req.userId,
      requestMeta: getRequestMeta(req),
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default { getMySessions, revokeSession, revokeAllSessions };
