export class AppError extends Error {
  constructor(statusCode, response) {
    const message = typeof response === 'string'
      ? response
      : response?.message || response?.error || 'Application error';
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

export const isAppError = (error) => (
  error instanceof AppError
  || (error && typeof error.statusCode === 'number' && error.response !== undefined)
);
