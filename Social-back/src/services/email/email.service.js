import nodemailer from 'nodemailer';
import { resolveMx } from 'dns/promises';
import templates from './email-templates.js';
import logger from '../../utils/logger.js';

const createSmtpTransporter = async () => {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

export const sendEmail = async ({ to, subject, text, html, meta } = {}) => {
  const transporter = await createSmtpTransporter();
  const from = process.env.SMTP_FROM;

  // Normalize/clean recipient for debugging (debug-only)
  const rawTo = to;
  const cleanedTo = String(to || '').trim().toLowerCase();

  // EMAIL INTERCEPTOR (diagnostic only): log raw vs cleaned recipient and bytes
  try {
    console.log('[EMAIL INTERCEPTOR] RAW TO:', JSON.stringify(rawTo));
    console.log('[EMAIL INTERCEPTOR] CLEANED TO:', JSON.stringify(cleanedTo));
    console.log('[EMAIL INTERCEPTOR] CHAR CODES RAW:', [...String(rawTo)].map((c) => c.charCodeAt(0)));
    console.log('[EMAIL INTERCEPTOR] CHAR CODES CLEANED:', [...String(cleanedTo)].map((c) => c.charCodeAt(0)));
    console.log('[EMAIL INTERCEPTOR] LENGTH RAW:', String(rawTo).length);
    console.log('[EMAIL INTERCEPTOR] LENGTH CLEANED:', String(cleanedTo).length);
    console.log('[EMAIL INTERCEPTOR CONTEXT]', { to: rawTo, cleanedTo, from, subject, meta, timestamp: new Date().toISOString() });
  } catch (logErr) {
    logger.warn(`Email interceptor logging failed: ${logErr?.message || String(logErr)}`);
  }

  // MX check (debug-only) - do not block send, only log
  try {
    const domain = (cleanedTo.split('@')[1] || '').toLowerCase();
    let mxOk = false;
    if (domain) {
      try {
        const mx = await resolveMx(domain);
        mxOk = Array.isArray(mx) && mx.length > 0;
      } catch (e) {
        mxOk = false;
      }
    }
    console.log('[EMAIL INTERCEPTOR] MX_CHECK:', { domain: domain || null, mxOk });
  } catch (mxErr) {
    logger.warn(`Email MX check failed: ${mxErr?.message || String(mxErr)}`);
  }

  // verify transporter before sending to surface connection/auth issues early
  try {
    await transporter.verify();
    console.log('[EMAIL INTERCEPTOR] transporter.verify(): OK');
  } catch (err) {
    console.error('[EMAIL INTERCEPTOR] transporter.verify() FAILED:', err && err.stack ? err.stack : err);
    logger.error(`SMTP transporter verify failed: ${err?.message || String(err)}`);
    throw err;
  }

  // Log attempt with optional meta (e.g., otpId)
  const attemptLog = { event: 'EMAIL_SEND_ATTEMPT', email: rawTo, cleanedEmail: cleanedTo, meta };
  console.log(JSON.stringify(attemptLog));

  try {
    const info = await transporter.sendMail({ from, to: cleanedTo, subject, text, html });
    const successLog = { event: 'EMAIL_SEND_SUCCESS', messageId: info?.messageId, accepted: info?.accepted, rejected: info?.rejected };
    console.log(JSON.stringify(successLog));
    return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response };
  } catch (err) {
    const failLog = { event: 'EMAIL_SEND_FAILED', error: (err && err.stack) || String(err), code: err?.code || null };
    console.error(JSON.stringify(failLog));
    logger.error(`sendMail failed: ${err?.message || String(err)}`);
    throw err;
  }
};

export const sendVerificationEmail = async ({ to, code, meta } = {}) => {
  const msg = templates.verificationEmail({ to, code });
  return sendEmail({ ...msg, meta });
};

export default { sendEmail, sendVerificationEmail };
