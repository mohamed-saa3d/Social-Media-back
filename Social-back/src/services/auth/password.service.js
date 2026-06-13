import bcrypt from 'bcryptjs';
import { AppError } from '../../utils/appError.js';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const hashPassword = (password) => bcrypt.hash(password, 10);

export const hashPasswordWithRounds = (password, rounds = 12) => bcrypt.hash(password, rounds);

export const comparePassword = (password, hashedPassword) => bcrypt.compare(password, hashedPassword);

export const isStrongPassword = (password) => passwordRegex.test(password);

export const validatePasswordChange = ({ currentPassword, newPassword, confirmNewPassword }) => {
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new AppError(400, { message: 'All password fields are required' });
  }

  if (newPassword !== confirmNewPassword) {
    throw new AppError(400, { message: 'New passwords do not match' });
  }

  if (!isStrongPassword(newPassword)) {
    throw new AppError(400, {
      message: 'New password must include uppercase, lowercase, number, and special character',
    });
  }

  if (newPassword === currentPassword) {
    throw new AppError(400, { message: 'New password must be different from current password' });
  }
};

export default {
  hashPassword,
  hashPasswordWithRounds,
  comparePassword,
  isStrongPassword,
  validatePasswordChange,
};
