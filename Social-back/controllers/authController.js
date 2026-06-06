import authService from '../src/services/authService.js';
import handleServiceError from '../src/utils/handleServiceError.js';

export const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword({
      userId: req.userId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      confirmNewPassword: req.body.confirmNewPassword,
      currentSessionId: req.sessionId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export default { changePassword };
