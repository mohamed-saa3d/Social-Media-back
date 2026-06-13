import User from '../../models/User.js';
import { AppError } from '../../utils/appError.js';
import tokenService from './token.service.js';
import passwordService from './password.service.js';
import blacklistService from './blacklist.service.js';
import sessionAuthService from './session-auth.service.js';

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

export const registerUser = async ({ username, email, password, requestMeta = {} }) => {
  if (!username || !email || !password) {
    throw new AppError(400, { success: false, message: 'Missing fields' });
  }

  if (!passwordService.isStrongPassword(password)) {
    throw new AppError(400, {
      success: false,
      message: 'Password must include uppercase, lowercase, number, and special character',
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(409, { success: false, message: 'User already exists' });
  }

  const hashedPassword = await passwordService.hashPassword(password);
  const user = await User.create({ username, email, password: hashedPassword });
  const authPayload = await issueAuthPayload(user, requestMeta);

  return {
    user: authPayload.user,
    accessToken: authPayload.accessToken,
    token: authPayload.accessToken,
    refreshToken: authPayload.refreshToken,
    cookieOptions: authPayload.cookieOptions,
    success: true,
  };
};

export const loginUser = async ({ email, password, requestMeta = {} }) => {
  if (!email || !password) {
    throw new AppError(400, { message: 'Missing email or password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError(400, { message: 'Invalid email or password' });
  }

  const isValid = await passwordService.comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError(401, { message: 'Invalid email or password' });
  }

  const authPayload = await issueAuthPayload(user, requestMeta);
  return {
    user: authPayload.user,
    accessToken: authPayload.accessToken,
    token: authPayload.accessToken,
    refreshToken: authPayload.refreshToken,
    cookieOptions: authPayload.cookieOptions,
    message: 'Login successful',
  };
};

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
