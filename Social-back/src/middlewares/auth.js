import jwt from 'jsonwebtoken';
import config from '../config.js';
import User from '../models/User.js';
import { validateSessionById } from '../services/sessionService.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const maybeUpdateLastActive = async (userId) => {
  const threshold = new Date(Date.now() - FIVE_MINUTES_MS);
  await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { lastActiveAt: { $lt: threshold } },
        { lastActiveAt: { $exists: false } },
      ],
    },
    { $set: { lastActiveAt: new Date(), isActive: true } },
  );
};

const hydrateRequestUser = async (req, userId, sessionId) => {
  req.userId = userId.toString();
  req.sessionId = sessionId ? sessionId.toString() : null;

  const user = await User.findById(userId).select('isAdmin');
  req.userIsAdmin = user?.isAdmin || false;
  await maybeUpdateLastActive(userId);
};

const getAccessTokenFromHeader = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.split(' ')[1];
};

// Optional auth middleware - attach user if a valid access token + session is present.
// If an access token is present but invalid/expired/session invalid -> 401
export const optionalAuth = async (req, res, next) => {
  const token = getAccessTokenFromHeader(req);
  if (!token) return next();

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    const { id: userId, sid } = payload || {};
    if (!userId || !sid) return res.status(401).json({ error: 'Unauthorized' });

    const session = await validateSessionById(sid);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    await hydrateRequestUser(req, userId, session._id);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Require auth middleware - strict: must present valid access token and session
export const requireAuth = async (req, res, next) => {
  const token = getAccessTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    const { id: userId, sid } = payload || {};
    if (!userId || !sid) return res.status(401).json({ error: 'Unauthorized' });

    const session = await validateSessionById(sid);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    await hydrateRequestUser(req, userId, session._id);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export default { optionalAuth, requireAuth };
