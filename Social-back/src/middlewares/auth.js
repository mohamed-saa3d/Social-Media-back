import User from '../models/User.js';
import authService from '../services/auth/auth.service.js';

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

const hydrateRequestUser = async (req, userId) => {
  req.userId = userId.toString();
  const user = await User.findById(userId).select('isAdmin');
  req.userIsAdmin = user?.isAdmin || false;
  await maybeUpdateLastActive(userId);
};

const getAccessTokenFromHeader = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.split(' ')[1];
};

export const optionalAuth = async (req, res, next) => {
  const token = getAccessTokenFromHeader(req);
  if (!token) return next();

  try {
    if (await authService.isAccessTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = await authService.verifyAccessToken(token);
    await hydrateRequestUser(req, payload.id);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export const requireAuth = async (req, res, next) => {
  const token = getAccessTokenFromHeader(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (await authService.isAccessTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = await authService.verifyAccessToken(token);
    await hydrateRequestUser(req, payload.id);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export default { optionalAuth, requireAuth };
