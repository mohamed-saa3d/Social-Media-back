import otpService from './otpService.js';
import emailService from './email/email.service.js';
import { AppError } from '../utils/appError.js';
import logger from '../utils/logger.js';

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length > 2 ? `${local[0]}***${local.slice(-1)}` : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
};

export const createAndSendOTP = async ({ userId, email, type = 'email_verify', ttlMs }) => {
  const timestamp = new Date().toISOString();
  logger.info(JSON.stringify({ event: 'OTP_CREATION_START', userId, email: maskEmail(email), type, timestamp }));

  // Generate and persist OTP
  const { otp, code, expiresAt } = await otpService.generateOTP({ userId, type, ttlMs });
  const otpId = otp?._id;
  logger.info(JSON.stringify({ event: 'OTP_CREATED', userId, otpId, type, expiresAt, timestamp: new Date().toISOString() }));

  // Attempt to send email; if it fails, expire the OTP and throw
  try {
    logger.info(JSON.stringify({ event: 'EMAIL_SEND_ATTEMPT', userId, email: maskEmail(email), type, otpId, timestamp: new Date().toISOString() }));
    const result = await emailService.sendVerificationEmail({ to: email, code, meta: { otpId } });
    logger.info(JSON.stringify({ event: 'EMAIL_SEND_SUCCESS', userId, email: maskEmail(email), type, otpId, messageId: result?.messageId, timestamp: new Date().toISOString() }));

    return {
      success: true,
      otpId,
      emailStatus: { accepted: result?.accepted, rejected: result?.rejected, messageId: result?.messageId },
    };
  } catch (err) {
    // Invalidate the OTP so it's not usable
    try {
      if (otpId) await otpService.expireOTP({ otpId });
    } catch (e) {
      logger.error(JSON.stringify({ event: 'OTP_EXPIRE_FAILED', userId, otpId, error: e?.message || String(e) }));
    }

    logger.error(JSON.stringify({ event: 'EMAIL_SEND_FAILED', userId, email: maskEmail(email), type, otpId, error: err?.message || String(err), timestamp: new Date().toISOString() }));
    throw new AppError(500, { success: false, message: 'Failed to send verification email' });
  }
};

export default { createAndSendOTP };
