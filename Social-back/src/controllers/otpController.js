import otpService from '../services/otpService.js';
import handleServiceError from '../utils/handleServiceError.js';

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

export default {
  sendOtp,
  verifyOtp,
};
