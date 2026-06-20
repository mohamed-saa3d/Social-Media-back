import authService from '../services/auth/auth.service.js';
import handleServiceError from '../utils/handleServiceError.js';

const setRefreshCookie = (res, refreshToken, cookieOptions) => {
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

export const registerUser = async (req, res) => {
  try {
    const result = await authService.registerUser({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      requestMeta: {
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip,
      },
    });

    // Return the registration result only. Do not set cookies or return tokens.
    return res.status(201).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const result = await authService.loginUser({
      email: req.body.email,
      password: req.body.password,
      requestMeta: {
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip,
      },
    });

    setRefreshCookie(res, result.refreshToken, result.cookieOptions);
    return res.status(200).json({
      message: 'Login successful',
      accessToken: result.accessToken,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const result = await authService.refreshTokens({
      refreshToken: req.cookies?.refreshToken,
      requestMeta: {
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip,
      },
    });

    setRefreshCookie(res, result.refreshToken, result.cookieOptions);
    return res.status(200).json({
      accessToken: result.accessToken,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword({
      userId: req.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      confirmNewPassword: req.body.confirmNewPassword,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const logoutUser = async (req, res) => {
  try {
    await authService.logoutUser({
      refreshToken: req.cookies?.refreshToken,
      authorizationHeader: req.headers?.authorization,
      requestMeta: {
        deviceInfo: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip,
      },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  logoutUser,
};
