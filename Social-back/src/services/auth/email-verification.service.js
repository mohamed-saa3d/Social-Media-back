import otpTransactionService from '../otpTransaction.service.js';
import otpService from '../../services/otpService.js';
import { OTP_TYPES } from '../../constants/auth.constants.js';

export const sendVerificationEmail = async ({ userId, email }) => {
  // Delegate to transactional service which handles OTP create + send + rollback
  return otpTransactionService.createAndSendOTP({ userId, email, type: OTP_TYPES.EMAIL_VERIFY });
};

export const verifyEmail = async ({ userId, code }) => {
  return otpService.verifyOTP({ userId, type: OTP_TYPES.EMAIL_VERIFY, code });
};

export const resendVerificationEmail = async ({ userId, email }) => {
  return sendVerificationEmail({ userId, email });
};

export default { sendVerificationEmail, verifyEmail, resendVerificationEmail };
