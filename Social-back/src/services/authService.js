import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../utils/appError.js';
import {
  createSessionTokens,
  revokeAllOtherSessions,
  revokeSessionByAccessToken,
  revokeSessionByRefreshToken,
} from './sessionService.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const buildPublicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
});

export const registerUser = async ({ username, email, password, requestMeta = {} }) => {
  if (!username || !email || !password) {
    throw new AppError(400, { success: false, message: 'Missing fields' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(409, { success: false, message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password: hashedPassword });
  const sessionTokens = await createSessionTokens(user._id, requestMeta);

  return {
    user: buildPublicUser(user),
    token: sessionTokens.accessToken,
    refreshToken: sessionTokens.refreshToken,
    cookieOptions: sessionTokens.cookieOptions,
    success: true,
  };
};

export const loginUser = async ({ email, password, requestMeta = {} }) => {
  if (!email || !password) {
    throw new AppError(400, { error: 'Missing email or password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError(400, { error: 'Invalid email or password' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError(401, { error: 'Invalid email or password' });
  }

  const sessionTokens = await createSessionTokens(user._id, requestMeta);

  return {
    user: buildPublicUser(user),
    token: sessionTokens.accessToken,
    refreshToken: sessionTokens.refreshToken,
    cookieOptions: sessionTokens.cookieOptions,
    message: 'Login successful',
  };
};

export const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
  confirmNewPassword,
  currentSessionId,
}) => {
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new AppError(400, { message: 'All password fields are required' });
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError(400, { message: 'New passwords do not match' });
  }

  if (!passwordRegex.test(newPassword)) {
    throw new AppError(400, {
      message: 'New password must include uppercase, lowercase, number, and special character',
    });
  }

  if (newPassword === currentPassword) {
    throw new AppError(400, { message: 'New password must be different from current password' });
  }

  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(404, { message: 'User not found' });
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    throw new AppError(400, { message: 'Current password is incorrect' });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  await revokeAllOtherSessions(userId, currentSessionId);

  return { message: 'Password changed successfully' };
};

export const logoutUser = async ({ refreshToken, authorizationHeader }) => {
  await revokeSessionByRefreshToken(refreshToken);

  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    const token = authorizationHeader.split(' ')[1];
    await revokeSessionByAccessToken(token);
  }

  return { message: 'Logged out successfully' };
};

export default {
  registerUser,
  loginUser,
  changePassword,
  logoutUser,
};
