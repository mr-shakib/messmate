import { Request, Response, NextFunction } from 'express';
import settlementService from '../services/settlement.service';
import { logger } from '../config/logger';

/**
 * Settlement Controller
 * Handles HTTP requests for settlement operations
 */
class SettlementController {
  /**
   * POST /api/settlements/contribution
   * Record a contribution to mess fund
   */
  async recordContribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { messId, memberId, amount, description, date } = req.body;

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
      if (!messId || !memberId || !amount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Record contribution
      const result = await settlementService.recordContribution(userId, {
        messId,
        memberId,
        amount,
        description,
        date: date ? new Date(date) : undefined,
      });

      logger.info(`Contribution recorded: ${result.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/settlements/refund
   * Record a refund from mess fund
   */
  async recordRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { messId, memberId, amount, description, date } = req.body;

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
      if (!messId || !memberId || !amount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Record refund
      const result = await settlementService.recordRefund(userId, {
        messId,
        memberId,
        amount,
        description,
        date: date ? new Date(date) : undefined,
      });

      logger.info(`Refund recorded: ${result.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/settlements
   * Get settlements with pagination and filtering
   */
  async getSettlements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { messId, page, limit, startDate, endDate, userId: filterUserId } = req.query;

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

      // Validate required query parameter
      if (!messId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Mess ID is required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Build filters
      const filters: any = {};
      if (page) filters.page = parseInt(page as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (filterUserId) filters.memberId = filterUserId;
      if (req.query.type) filters.type = req.query.type;

      // Get settlements
      const result = await settlementService.getSettlements(
        messId as string,
        userId,
        filters
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/settlements/suggestions
   * Get settlement suggestions using simplification algorithm
   */
  async getSettlementSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { messId } = req.query;

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

      // Validate required query parameter
      if (!messId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Mess ID is required',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Get settlement suggestions
      const result = await settlementService.getSettlementSuggestions(
        messId as string,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export default new SettlementController();
