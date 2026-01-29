import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Rate limiter for authentication routes
 * Limits to 100 requests per 15 minutes per IP address
 */
export const authRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs, // 15 minutes (900000 ms)
  max: env.rateLimitMaxRequests, // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      timestamp: new Date(),
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests (only count failed attempts)
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

/**
 * Stricter rate limiter for sensitive operations (e.g., password reset)
 * Limits to 5 requests per 15 minutes per IP address
 */
export const strictRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts, please try again later',
      timestamp: new Date(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * Limits to 1000 requests per 15 minutes per IP address
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many API requests, please try again later',
      timestamp: new Date(),
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
