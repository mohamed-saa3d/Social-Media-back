import { resolveMx } from 'dns/promises';

export const validateEmailFormat = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(email);
};

export const getEmailDomain = (email) => {
  if (!validateEmailFormat(email)) return null;
  return email.split('@')[1].toLowerCase();
};

export const hasMxRecords = async (domain) => {
  try {
    const records = await resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch (err) {
    return false;
  }
};

export const validateEmailDeliverability = async (email) => {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return hasMxRecords(domain);
};

export default {
  validateEmailFormat,
  getEmailDomain,
  hasMxRecords,
  validateEmailDeliverability,
};
