import mongoose from 'mongoose';
import ActivityLog, { ActivityType } from '../models/ActivityLog';
import User from '../models/User';
import authorizationService from './authorization.service';

/**
 * DTOs for ActivityLogService
 */
export interface ActivityFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  activityType?: ActivityType;
}

export interface ActivityLogResponse {
  id: string;
  messId: string;
  userId: string;
  userName: string;
  action: string;
  activityType: string;
  details: any;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * ActivityLogService handles comprehensive activity logging for mess operations
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
class ActivityLogService {
  /**
   * Log expense-related activity
   * @param messId - Mess ID
   * @param userId - User ID who performed the action
   * @param action - Action performed ('created', 'updated', 'deleted')
   * @param expenseId - Expense ID
   * @param details - Additional details about the activity
   * Requirements: 9.1
   */
  async logExpenseActivity(
    messId: string,
    userId: string,
    action: 'created' | 'updated' | 'deleted',
    expenseId: string,
    details: any
  ): Promise<void> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new Error('Invalid expense ID');
    }

    // Validate action
    if (!['created', 'updated', 'deleted'].includes(action)) {
      throw new Error('Invalid action for expense activity');
    }

    // Create activity log
    const activityLog = new ActivityLog({
      messId: new mongoose.Types.ObjectId(messId),
      userId: new mongoose.Types.ObjectId(userId),
      action,
      activityType: 'expense',
      resourceId: new mongoose.Types.ObjectId(expenseId),
      details: details || {},
      timestamp: new Date(),
    });

    await activityLog.save();
  }

  /**
   * Log settlement-related activity
   * @param messId - Mess ID
   * @param userId - User ID who performed the action
   * @param settlementId - Settlement ID
   * @param details - Additional details about the activity
   * Requirements: 9.2
   */
  async logSettlementActivity(
    messId: string,
    userId: string,
    settlementId: string,
    details: any
  ): Promise<void> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    if (!mongoose.Types.ObjectId.isValid(settlementId)) {
      throw new Error('Invalid settlement ID');
    }

    // Create activity log
    const activityLog = new ActivityLog({
      messId: new mongoose.Types.ObjectId(messId),
      userId: new mongoose.Types.ObjectId(userId),
      action: 'created', // Settlements are immutable, only created
      activityType: 'settlement',
      resourceId: new mongoose.Types.ObjectId(settlementId),
      details: details || {},
      timestamp: new Date(),
    });

    await activityLog.save();
  }

  /**
   * Log member-related activity
   * @param messId - Mess ID
   * @param action - Action performed ('joined', 'left', 'role_changed')
   * @param userId - User ID of the member
   * @param details - Additional details about the activity
   * Requirements: 9.3, 9.4
   */
  async logMemberActivity(
    messId: string,
    action: 'joined' | 'left' | 'role_changed',
    userId: string,
    details: any
  ): Promise<void> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Validate action
    if (!['joined', 'left', 'role_changed'].includes(action)) {
      throw new Error('Invalid action for member activity');
    }

    // Create activity log
    const activityLog = new ActivityLog({
      messId: new mongoose.Types.ObjectId(messId),
      userId: new mongoose.Types.ObjectId(userId),
      action,
      activityType: 'member',
      resourceId: new mongoose.Types.ObjectId(userId), // For member activities, resourceId is the user
      details: details || {},
      timestamp: new Date(),
    });

    await activityLog.save();
  }

  /**
   * Get activity logs with role-based filtering
   * @param messId - Mess ID
   * @param userId - User ID requesting the logs
   * @param filters - Pagination and filtering options
   * @returns Paginated activity log response
   * Requirements: 9.5, 9.6
   */
  async getActivityLogs(
    messId: string,
    userId: string,
    filters: ActivityFilters = {}
  ): Promise<PaginatedResponse<ActivityLogResponse>> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Get user role for filtering
    const userRole = await authorizationService.getUserRole(userId, messId);

    // Build query
    const query: any = {
      messId: new mongoose.Types.ObjectId(messId),
    };

    // Role-based filtering
    // Owner: Can view all logs
    // Admin: Can view expense and settlement activities only
    // Member: No access (will be handled by authorization check in controller)
    if (userRole === 'Admin') {
      query.activityType = { $in: ['expense', 'settlement'] };
    } else if (userRole === 'Member') {
      throw new Error('Unauthorized: Members cannot view activity logs');
    }

    // Apply filters
    if (filters.activityType) {
      // If Admin is trying to view member activities, deny
      if (userRole === 'Admin' && filters.activityType === 'member') {
        throw new Error('Unauthorized: Admins cannot view member activities');
      }
      query.activityType = filters.activityType;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Cap at 100
    const skip = (page - 1) * limit;

    // Execute query
    const [logs, totalCount] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    // Get user information for all logs
    const userIds = [...new Set(logs.map((log) => log.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Format response
    const data: ActivityLogResponse[] = logs.map((log) => {
      const user = userMap.get(log.userId.toString());
      return {
        id: log._id.toString(),
        messId: log.messId.toString(),
        userId: log.userId.toString(),
        userName: user?.name || 'Unknown',
        action: log.action,
        activityType: log.activityType,
        details: log.details,
        timestamp: log.timestamp,
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    };
  }
}

// Export singleton instance
export default new ActivityLogService();
