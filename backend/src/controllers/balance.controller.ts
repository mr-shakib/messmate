import { Request, Response, NextFunction } from 'express';
import balanceService from '../services/balance.service';

/**
 * Balance Controller
 * Handles HTTP requests for balance operations
 */
class BalanceController {
  /**
   * GET /api/balances/mess-fund
   * Get mess fund balance
   */
  async getMessFundBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { messId } = req.query;

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

      // Get mess fund balance
      const result = await balanceService.getMessFundBalance(messId as string);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/balances/me
   * Get the authenticated user's balance in a mess
   */
  async getMyBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get user's balance
      const result = await balanceService.calculateMemberBalance(
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

  /**
   * GET /api/balances
   * Get all member balances in a mess (Owner/Admin only)
   */
  async getAllBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get all balances
      const result = await balanceService.getAllBalances(
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

  /**
   * GET /api/balances/:userId/breakdown
   * Get detailed balance breakdown for a user
   */
  async getBalanceBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestingUserId = req.user?.userId;
      const { userId } = req.params;
      const { messId } = req.query;

      if (!requestingUserId) {
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

      // Get balance breakdown
      // Note: Authorization is handled in the service layer
      const result = await balanceService.getBalanceBreakdown(
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
export default new BalanceController();
