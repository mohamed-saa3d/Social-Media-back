export const OTP_TYPES = {
  EMAIL_VERIFY: 'email_verify',
  PASSWORD_RESET: 'password_reset',
};

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
};

export const AUTH_MESSAGES = {
  USER_EXISTS: 'User already exists',
  MISSING_FIELDS: 'Missing fields',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Email not verified',
};

export default {
  OTP_TYPES,
  PASSWORD_REGEX,
  PASSWORD_RULES,
  TOKEN_TYPES,
  AUTH_MESSAGES,
};
