import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

/**
 * Authentication middleware to verify JWT tokens on protected routes
 * Extracts user information from token and attaches to request object
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'No authorization token provided',
          timestamp: new Date(),
          path: req.path,
        },
      });
      return;
    }

    // Check if header follows "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
          timestamp: new Date(),
          path: req.path,
        },
      });
      return;
    }

    const token = parts[1];

    // Verify token
    try {
      const decoded = verifyAccessToken(token);

      // Attach user information to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      // Handle token verification errors
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';

      if (errorMessage.includes('expired')) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
          timestamp: new Date(),
          path: req.path,
        },
      });
      return;
    }
  } catch (error) {
    // Catch any unexpected errors
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'An error occurred during authentication',
        timestamp: new Date(),
        path: req.path,
      },
    });
    return;
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present and valid, but doesn't fail if missing
 */
export const optionalAuthenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without user info
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];

      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      } catch (error) {
        // Invalid token, but don't fail - just continue without user info
      }
    }

    next();
  } catch (error) {
    // Continue even if there's an error
    next();
  }
};
