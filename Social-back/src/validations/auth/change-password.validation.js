import { body } from 'express-validator';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(passwordRegex)
    .withMessage('New password does not meet complexity requirements'),
  body('confirmNewPassword').notEmpty().withMessage('Confirm new password is required'),
];

export default changePasswordValidation;
