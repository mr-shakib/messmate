import { Request, Response, NextFunction } from 'express';
import activityLogService from '../services/activityLog.service';

/**
 * Activity Log Controller
 * Handles HTTP requests for activity log operations
 */
class ActivityLogController {
  /**
   * GET /api/activity-logs
   * Get activity logs with pagination and filtering
   */
  async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { messId, page, limit, startDate, endDate, activityType } = req.query;

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
      if (activityType) filters.activityType = activityType;

      // Get activity logs
      const result = await activityLogService.getActivityLogs(
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
}

// Export singleton instance
export default new ActivityLogController();
