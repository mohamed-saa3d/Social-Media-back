import User from '../../models/User.js';
import { AppError } from '../../utils/appError.js';
import passwordService from './password.service.js';
import emailVerificationService from './email-verification.service.js';
import { AUTH_MESSAGES } from '../../constants/auth.constants.js';

export const registerUser = async ({ username, email, password, requestMeta = {} }) => {
  if (!username || !email || !password) {
    throw new AppError(400, { success: false, message: AUTH_MESSAGES.MISSING_FIELDS });
  }

  if (!passwordService.isStrongPassword(password)) {
    throw new AppError(400, {
      success: false,
      message: 'Password must include uppercase, lowercase, number, and special character',
    });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(409, { success: false, message: AUTH_MESSAGES.USER_EXISTS });
  }

  const hashedPassword = await passwordService.hashPassword(password);
  const user = await User.create({ username, email, password: hashedPassword, emailVerified: false });

  // Generate email verification OTP and send verification email
  try {
    await emailVerificationService.sendVerificationEmail({ userId: user._id, email });
  } catch (err) {
    // Roll back created user if email send fails (debug-only safety)
    try {
      await User.deleteOne({ _id: user._id });
    } catch (delErr) {
      // best-effort rollback; log and continue to throw original error
      // eslint-disable-next-line no-console
      console.error('Failed to rollback user after email send failure:', delErr && delErr.stack ? delErr.stack : delErr);
    }
    throw new AppError(500, { success: false, message: 'Failed to send verification email' });
  }

  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    success: true,
    message: 'User created. Verification email sent.',
  };
};

export default { registerUser };
