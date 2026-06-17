import otpService from '../services/otpService.js';
import handleServiceError from '../utils/handleServiceError.js';
import User from '../models/User.js';
import tokenService from '../services/auth/token.service.js';
import sessionAuthService from '../services/auth/session-auth.service.js';
import mailService from '../services/mail.service.js';
import otpTransactionService from '../services/otpTransaction.service.js';


export const sendOtp = async (req, res) => {
  try {
    const result = await otpService.generateOTP({
      userId: req.userId,
      type: req.body.type,
      ttlMs: req.body.ttlMs,
    });
    return res.status(201).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const result = await otpService.verifyOTP({
      userId: req.userId,
      type: req.body.type,
      code: req.body.code,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      throw new Error('Missing email or code');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await otpService.verifyOTP({ userId: user._id, type: 'email_verify', code });

    // Mark user verified
    user.emailVerified = true;
    await user.save();

    // Create session and issue tokens
    const authPayload = await (async () => {
      const accessToken = tokenService.signAccessToken(user._id.toString());
      const refreshToken = tokenService.signRefreshToken(user._id.toString());
      await tokenService.storeRefreshToken({ userId: user._id, refreshToken, requestMeta: {} });
      await sessionAuthService.recordAuthSession({ userId: user._id, requestMeta: {} });
      return { accessToken, refreshToken };
    })();

    // Set refresh cookie
    const cookieOptions = tokenService.buildRefreshCookieOptions();
    res.cookie('refreshToken', authPayload.refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      user: { id: user._id, username: user.username, email: user.email },
      accessToken: authPayload.accessToken,
      refreshToken: authPayload.refreshToken,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new Error('Missing email');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    // Use transactional flow: generate OTP, send email, expire on failure
    await otpTransactionService.createAndSendOTP({ userId: user._id, email, type: 'email_verify' });
    return res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default {
  sendOtp,
  verifyOtp,
};
