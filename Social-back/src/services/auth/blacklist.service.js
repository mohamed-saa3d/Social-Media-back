import BlacklistedToken from '../../models/BlacklistedToken.js';
import tokenService from './token.service.js';

export const isTokenBlacklisted = async (token) => {
  const entry = await BlacklistedToken.findOne({ token });
  return Boolean(entry);
};

export const addTokenToBlacklist = async (token) => {
  if (!token) return null;

  try {
    const payload = tokenService.verifyAccessToken(token);
    const expiresAt = payload?.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);

    await BlacklistedToken.updateOne(
      { token },
      { $setOnInsert: { token, expiresAt } },
      { upsert: true },
    );
  } catch (error) {
    // best-effort logout
  }

  return true;
};

export default {
  isTokenBlacklisted,
  addTokenToBlacklist,
};
