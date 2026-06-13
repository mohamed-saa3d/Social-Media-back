import authService from '../services/auth/auth.service.js';
import userService from '../services/userService.js';
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

    setRefreshCookie(res, result.refreshToken, result.cookieOptions);
    return res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
    });
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
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await userService.getMyProfile(req.userId);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const updateUser = async (req, res) => {
  try {
    const updated = await userService.updateUser(req.resource, req.body);
    return res.status(200).json(updated);
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

export const deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.resource);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const followUser = async (req, res) => {
  try {
    const result = await userService.followUser({
      targetUserId: req.params.id,
      followerUserId: req.userId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
