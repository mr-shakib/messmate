import { Request, Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';

/**
 * Dashboard Controller
 * Handles HTTP requests for dashboard data
 */
class DashboardController {
  /**
   * GET /api/dashboard
   * Get dashboard data for a mess
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get dashboard data
      const result = await dashboardService.getDashboardData(
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
export default new DashboardController();
