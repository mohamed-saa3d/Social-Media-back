import User from '../../models/User.js';
import { AppError } from '../../utils/appError.js';
import passwordService from './password.service.js';
import tokenService from './token.service.js';
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

export const loginUser = async ({ email, password, requestMeta = {} }) => {
  if (!email || !password) {
    throw new AppError(400, { message: 'Missing email or password' });
  }

  const user = await User.findOne({ email }).select('+password emailVerified');
  if (!user) {
    throw new AppError(400, { message: 'Invalid email or password' });
  }

  const isValid = await passwordService.comparePassword(password, user.password);
  if (!isValid) {
    throw new AppError(401, { message: 'Invalid email or password' });
  }

  if (!user.emailVerified) {
    throw new AppError(403, { message: 'Email not verified' });
  }

  const accessToken = tokenService.signAccessToken(user._id.toString());
  const refreshToken = tokenService.signRefreshToken(user._id.toString());

  await tokenService.storeRefreshToken({ userId: user._id, refreshToken, requestMeta });
  await sessionAuthService.recordAuthSession({ userId: user._id, requestMeta });

  return {
    user: buildPublicUser(user),
    accessToken,
    token: accessToken,
    refreshToken,
    cookieOptions: tokenService.buildRefreshCookieOptions(),
    message: 'Login successful',
  };
};

export default { loginUser };
