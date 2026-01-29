import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { logger } from '../config/logger';

/**
 * Auth Controller
 * Handles HTTP requests for authentication operations
 */
class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, email, and password are required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Register user
      const result = await authService.register({ name, email, password });

      logger.info(`User registered successfully: ${email}`);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login user with credentials
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Login user
      const result = await authService.login({ email, password });

      logger.info(`User logged in successfully: ${email}`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Validate required field
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Refresh tokens
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user by invalidating refresh token
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.userId;

      // Validate required fields
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Logout user
      await authService.logout(userId, refreshToken);

      logger.info(`User logged out successfully: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/revoke
   * Revoke all refresh tokens for the authenticated user
   */
  async revokeAllTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Revoke all tokens
      await authService.revokeAllTokens(userId);

      logger.info(`All tokens revoked for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: 'All tokens revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export default new AuthController();
