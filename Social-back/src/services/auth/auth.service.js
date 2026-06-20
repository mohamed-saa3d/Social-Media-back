import { AppError } from '../../utils/appError.js';
import User from '../../models/User.js';
import tokenService from './token.service.js';
import passwordService from './password.service.js';
import blacklistService from './blacklist.service.js';
import sessionAuthService from './session-auth.service.js';
import registerService from './register.service.js';
import loginService from './login.service.js';

const buildPublicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  location: user.location,
  isAdmin: user.isAdmin,
});

const issueAuthPayload = async (user, requestMeta = {}) => {
  const accessToken = tokenService.signAccessToken(user._id.toString());
  const refreshToken = tokenService.signRefreshToken(user._id.toString());

  await tokenService.storeRefreshToken({
    userId: user._id,
    refreshToken,
    requestMeta,
  });

  await sessionAuthService.recordAuthSession({
    userId: user._id,
    requestMeta,
  });

  return {
    accessToken,
    refreshToken,
    cookieOptions: tokenService.buildRefreshCookieOptions(),
    user: buildPublicUser(user),
  };
};

export const registerUser = async (args) => {
  // Delegate registration to registerService which creates the user,
  // generates and sends the verification OTP/email and returns the result.
  // Do NOT issue tokens or create sessions at registration.
  const result = await registerService.registerUser(args);
  return result;
};

export const loginUser = async (args) => loginService.loginUser(args);

export const refreshTokens = async ({ refreshToken, requestMeta = {} }) => {
  if (!refreshToken) {
    throw new AppError(401, { message: 'Refresh token is required' });
  }

  const payload = tokenService.verifyRefreshToken(refreshToken);
  const tokenHash = tokenService.hashToken(refreshToken);
  const tokenRecord = await tokenService.findActiveRefreshTokenRecord(refreshToken);

  if (!tokenRecord) {
    const existingRecord = await tokenService.findRefreshTokenRecordByHash(tokenHash);
    if (existingRecord?.revokedAt) {
      throw new AppError(401, { message: 'Refresh token has already been used' });
    }

    throw new AppError(401, { message: 'Refresh token is invalid or expired' });
  }

  tokenRecord.revokedAt = new Date();
  await tokenRecord.save();

  const user = await User.findById(payload.id);
  if (!user) {
    throw new AppError(404, { message: 'User not found' });
  }

  const newRefreshToken = tokenService.signRefreshToken(user._id.toString());
  const newAccessToken = tokenService.signAccessToken(user._id.toString());

  await tokenService.storeRefreshToken({
    userId: user._id,
    refreshToken: newRefreshToken,
    requestMeta,
  });

  await sessionAuthService.recordAuthSession({
    userId: user._id,
    requestMeta,
  });

  return {
    accessToken: newAccessToken,
    token: newAccessToken,
    refreshToken: newRefreshToken,
    cookieOptions: tokenService.buildRefreshCookieOptions(),
    user: buildPublicUser(user),
  };
};

export const logoutUser = async ({ refreshToken, authorizationHeader, requestMeta = {} }) => {
  let userId = null;

  if (refreshToken) {
    const tokenRecord = await tokenService.findActiveRefreshTokenRecord(refreshToken);
    if (tokenRecord) {
      userId = tokenRecord.userId;
      tokenRecord.revokedAt = new Date();
      await tokenRecord.save();
    }
  }

  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.split(' ')[1];
    await blacklistService.addTokenToBlacklist(token);
  }

  if (userId) {
    await sessionAuthService.revokeAuthSession({
      userId,
      requestMeta,
    });
  }

  return { message: 'Logged out successfully' };
};

export const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
  confirmNewPassword,
}) => {
  passwordService.validatePasswordChange({
    currentPassword,
    newPassword,
    confirmNewPassword,
  });

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(404, { message: 'User not found' });
  }

  const isCurrentValid = await passwordService.comparePassword(currentPassword, user.password);
  if (!isCurrentValid) {
    throw new AppError(400, { message: 'Current password is incorrect' });
  }

  user.password = await passwordService.hashPasswordWithRounds(newPassword, 12);
  await user.save();

  await tokenService.revokeAllRefreshTokensForUser(userId);

  return { message: 'Password changed successfully' };
};

export const isAccessTokenBlacklisted = blacklistService.isTokenBlacklisted;
export const verifyAccessToken = tokenService.verifyAccessToken;
export const blacklistAccessToken = blacklistService.addTokenToBlacklist;

export default {
  registerUser,
  loginUser,
  refreshTokens,
  changePassword,
  logoutUser,
  isAccessTokenBlacklisted,
  verifyAccessToken,
  blacklistAccessToken,
};
