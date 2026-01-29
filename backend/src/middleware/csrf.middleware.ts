import { Request, Response, NextFunction } from 'express';
import Tokens from 'csrf';
import { logger } from '../config/logger';

// Create CSRF token generator
const tokens = new Tokens();

// Store secrets in memory (in production, use Redis or similar)
const csrfSecrets = new Map<string, string>();

/**
 * Generate CSRF token for a session
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Use IP address as consistent session identifier
    // This ensures the same secret is used before and after login
    const sessionId = req.ip || 'anonymous';
    
    // Check if we already have a secret for this session
    let secret = csrfSecrets.get(sessionId);
    
    if (!secret) {
      // Generate a new secret for this session
      secret = tokens.secretSync();
      csrfSecrets.set(sessionId, secret);
    }
    
    // Create token from the secret
    const token = tokens.create(secret);
    
    // Send token in cookie and response
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Allow JavaScript to read for sending in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });
    
    // Also attach to response locals for template rendering if needed
    res.locals.csrfToken = token;
    
    next();
  } catch (error) {
    logger.error('Error generating CSRF token:', error);
    next(error);
  }
};

/**
 * Verify CSRF token for state-changing operations
 */
export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction): Response | void => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  try {
    // Get token from header or body
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    
    if (!token || typeof token !== 'string') {
      return res.status(403).json({
        status: 'error',
        message: 'CSRF token missing',
      });
    }
    
    // Use IP address as consistent session identifier (same as generateCsrfToken)
    const sessionId = req.ip || 'anonymous';
    const secret = csrfSecrets.get(sessionId);
    
    if (!secret) {
      logger.warn(`CSRF secret not found for ${sessionId} (${req.method} ${req.path})`);
      return res.status(403).json({
        status: 'error',
        message: 'CSRF secret not found. Please refresh the page.',
      });
    }
    
    // Verify token
    const isValid = tokens.verify(secret, token);
    
    if (!isValid) {
      logger.warn(`Invalid CSRF token from ${req.ip}`);
      return res.status(403).json({
        status: 'error',
        message: 'Invalid CSRF token',
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error verifying CSRF token:', error);
    return res.status(403).json({
      status: 'error',
      message: 'CSRF verification failed',
    });
  }
};

/**
 * Cleanup expired CSRF secrets (call periodically)
 */
export const cleanupCsrfSecrets = (): void => {
  // In a real application, implement TTL-based cleanup
  // For now, we rely on the cookie expiration
  logger.info('CSRF secrets cleanup executed');
};
