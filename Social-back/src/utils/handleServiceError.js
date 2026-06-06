import { isAppError } from './appError.js';

export default function handleServiceError(res, error) {
  if (isAppError(error)) {
    return res.status(error.statusCode).json(error.response);
  }

  throw error;
}
