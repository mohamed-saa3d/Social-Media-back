import sessionService from '../src/services/sessionService.js';
import handleServiceError from '../src/utils/handleServiceError.js';

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
    const result = await sessionService.revokeAllOtherSessionsFromRefreshToken(
      req.userId,
      req.cookies?.refreshToken,
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default { getMySessions, revokeSession, revokeAllSessions };
