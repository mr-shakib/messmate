import { Request, Response, NextFunction } from 'express';
import messService from '../services/mess.service';
import { logger } from '../config/logger';

/**
 * Mess Controller
 * Handles HTTP requests for mess management operations
 */
class MessController {
  /**
   * POST /api/messes
   * Create a new mess
   */
  async createMess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { name, memberLimit, description } = req.body;

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

      // Validate required fields
      if (!name || !memberLimit) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name and member limit are required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Create mess
      const result = await messService.createMess(userId, {
        name,
        memberLimit,
        description,
      });

      logger.info(`Mess created successfully: ${result.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/messes
   * Get all messes for the authenticated user
   */
  async getUserMesses(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get user's messes
      const result = await messService.getUserMesses(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/messes/:id
   * Get mess details
   */
  async getMess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

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

      // Get mess
      const result = await messService.getMess(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/messes/:id
   * Update mess details
   */
  async updateMess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { name, memberLimit, description } = req.body;

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

      // Update mess
      const result = await messService.updateMess(id, userId, {
        name,
        memberLimit,
        description,
      });

      logger.info(`Mess updated successfully: ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/messes/:id/invite
   * Generate invite link for a mess
   */
  async generateInviteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { expiresInHours = 24 } = req.body;

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

      // Generate invite link
      const result = await messService.generateInviteLink(id, userId, expiresInHours);

      logger.info(`Invite link generated for mess: ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/messes/join/code
   * Join a mess using invite code
   */
  async joinByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { inviteCode } = req.body;

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

      // Validate required field
      if (!inviteCode) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invite code is required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Join mess
      const result = await messService.joinMessByCode(userId, inviteCode);

      logger.info(`User ${userId} joined mess ${result.id} via invite code`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/messes/join/link
   * Join a mess using invite link token
   */
  async joinByLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { token } = req.body;

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

      // Validate required field
      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invite link token is required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Join mess
      const result = await messService.joinMessByLink(userId, token);

      logger.info(`User ${userId} joined mess ${result.id} via invite link`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/messes/:id/members/:memberId
   * Remove a member from a mess
   */
  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id, memberId } = req.params;

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

      // Remove member
      await messService.removeMember(id, userId, memberId);

      logger.info(`Member ${memberId} removed from mess ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export default new MessController();
