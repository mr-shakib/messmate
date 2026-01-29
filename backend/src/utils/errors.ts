import { AppError } from '../middleware/errorHandler';

/**
 * Utility functions for creating common application errors
 * These provide consistent error codes and messages across the application
 */

// Validation Errors (400)
export const createValidationError = (message: string, details?: any): AppError => {
  return new AppError(message, 400, 'VALIDATION_ERROR', details);
};

export const createInvalidIdError = (field: string = 'ID'): AppError => {
  return new AppError(`Invalid ${field}`, 400, 'INVALID_ID');
};

export const createRequiredFieldError = (field: string): AppError => {
  return new AppError(`${field} is required`, 400, 'REQUIRED_FIELD');
};

// Authentication Errors (401)
export const createAuthenticationError = (message: string = 'Authentication failed'): AppError => {
  return new AppError(message, 401, 'AUTHENTICATION_ERROR');
};

export const createInvalidCredentialsError = (): AppError => {
  return new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
};

export const createTokenExpiredError = (): AppError => {
  return new AppError('Token expired. Please log in again', 401, 'TOKEN_EXPIRED');
};

export const createInvalidTokenError = (): AppError => {
  return new AppError('Invalid token. Please log in again', 401, 'INVALID_TOKEN');
};

// Authorization Errors (403)
export const createAuthorizationError = (message: string = 'Unauthorized access'): AppError => {
  return new AppError(message, 403, 'AUTHORIZATION_ERROR');
};

export const createInsufficientPermissionsError = (action: string): AppError => {
  return new AppError(
    `You do not have permission to ${action}`,
    403,
    'INSUFFICIENT_PERMISSIONS'
  );
};

// Not Found Errors (404)
export const createNotFoundError = (resource: string): AppError => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

// Conflict Errors (409)
export const createConflictError = (message: string, details?: any): AppError => {
  return new AppError(message, 409, 'CONFLICT', details);
};

export const createDuplicateError = (field: string, value: string): AppError => {
  return new AppError(
    `${field} '${value}' already exists`,
    409,
    'DUPLICATE_KEY',
    { field, value }
  );
};

// Business Logic Errors (422)
export const createBusinessLogicError = (message: string, details?: any): AppError => {
  return new AppError(message, 422, 'BUSINESS_LOGIC_ERROR', details);
};

// Rate Limit Errors (429)
export const createRateLimitError = (): AppError => {
  return new AppError(
    'Too many requests. Please try again later',
    429,
    'RATE_LIMIT_EXCEEDED'
  );
};

// Server Errors (500)
export const createInternalError = (message: string = 'Internal server error'): AppError => {
  return new AppError(message, 500, 'INTERNAL_ERROR');
};
