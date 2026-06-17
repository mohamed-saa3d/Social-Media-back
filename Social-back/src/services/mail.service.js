import emailService from './email/email.service.js';

export const sendVerificationEmail = emailService.sendVerificationEmail;
export const sendEmail = emailService.sendEmail;

export default {
  sendVerificationEmail,
  sendEmail,
};