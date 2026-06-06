import adminService from '../src/services/adminService.js';
import handleServiceError from '../src/utils/handleServiceError.js';

export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await adminService.getAllUsersAdmin();
    return res.status(200).json(users);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const result = await adminService.deleteUserAdmin({
      targetUserId: req.params.id,
      requesterUserId: req.userId,
      requesterIsAdmin: req.userIsAdmin,
    });
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const deletePostAdmin = async (req, res) => {
  try {
    const result = await adminService.deletePostAdmin(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const viewStats = async (req, res) => {
  try {
    const stats = await adminService.viewStats();
    return res.status(200).json(stats);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const demoteAdmin = async (req, res) => {
  try {
    const result = await adminService.demoteAdmin(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
