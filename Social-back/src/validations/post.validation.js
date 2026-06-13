import { body } from 'express-validator';

export const createPostValidation = [
  body('text').optional().isString(),
];

export const updatePostValidation = [
  body('content').optional().isString(),
  body('image').optional().isString(),
  body('visibility').optional().isIn(['public', 'private', 'friends']),
];
