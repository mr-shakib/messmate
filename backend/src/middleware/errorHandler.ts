/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { Error as MongooseError } from 'mongoose';

/**
 * Custom application error class for operational errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response interface matching design document specification
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    path: string;
  };
}

/**
 * Handle Mongoose validation errors
 */
const handleMongooseValidationError = (err: MongooseError.ValidationError): AppError => {
  const errors = Object.values(err.errors).map((error) => ({
    field: error.path,
    message: error.message,
  }));

  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    errors
  );
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
const handleMongooseCastError = (err: MongooseError.CastError): AppError => {
  return new AppError(
    `Invalid ${err.path}: ${err.value}`,
    400,
    'INVALID_ID',
    { field: err.path, value: err.value }
  );
};

/**
 * Handle MongoDB duplicate key errors
 */
const handleMongoDuplicateKeyError = (err: any): AppError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  
  return new AppError(
    `${field} '${value}' already exists`,
    409,
    'DUPLICATE_KEY',
    { field, value }
  );
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError => {
  return new AppError(
    'Invalid token. Please log in again',
    401,
    'INVALID_TOKEN'
  );
};

/**
 * Handle JWT expiration errors
 */
const handleJWTExpiredError = (): AppError => {
  return new AppError(
    'Token expired. Please log in again',
    401,
    'TOKEN_EXPIRED'
  );
};

/**
 * Sanitize error message for production
 * Removes sensitive information and stack traces
 */
const sanitizeErrorMessage = (message: string, isProduction: boolean): string => {
  if (!isProduction) {
    return message;
  }

  // In production, return generic messages for certain error types
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /connection/i,
    /database/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return 'An error occurred while processing your request';
    }
  }

  return message;
};

/**
 * Format error response according to design specification
 */
const formatErrorResponse = (
  err: AppError,
  req: Request,
  isProduction: boolean
): ErrorResponse => {
  return {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: sanitizeErrorMessage(err.message, isProduction),
      details: isProduction ? undefined : err.details,
      timestamp: new Date(),
      path: req.path,
    },
  };
};

/**
 * Centralized error handling middleware
 * Catches all errors, logs them, and returns consistent error responses
 */
export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  let error = err;

  // Log error details
  logger.error(`Error: ${err.message}`, {
    method: req.method,
    path: req.path,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.userId,
  });

  // Convert known error types to AppError
  if (err.name === 'ValidationError' && err instanceof MongooseError.ValidationError) {
    error = handleMongooseValidationError(err);
  } else if (err.name === 'CastError' && err instanceof MongooseError.CastError) {
    error = handleMongooseCastError(err);
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    error = handleMongoDuplicateKeyError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (!(err instanceof AppError)) {
    // Convert unknown errors to AppError
    error = new AppError(
      err.message || 'Internal server error',
      err.statusCode || 500,
      'INTERNAL_ERROR'
    );
  }

  // Format and send error response
  const statusCode = error.statusCode || 500;
  const errorResponse = formatErrorResponse(error, req, isProduction);

  res.status(statusCode).json(errorResponse);
};
