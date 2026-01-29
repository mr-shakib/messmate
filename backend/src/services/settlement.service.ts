import mongoose from 'mongoose';
import Settlement, { ISettlement, SettlementType } from '../models/Settlement';
import Mess from '../models/Mess';
import User from '../models/User';
import authorizationService from './authorization.service';
import activityLogService from './activityLog.service';
import balanceService from './balance.service';

/**
 * DTOs for SettlementService
 */
export interface RecordContributionDTO {
  messId: string;
  memberId: string;
  amount: number;
  description?: string;
  date?: Date;
}

export interface RecordRefundDTO {
  messId: string;
  memberId: string;
  amount: number;
  description?: string;
  date?: Date;
}

export interface SettlementFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  memberId?: string; // Filter settlements for this member
  type?: SettlementType; // Filter by contribution or refund
}

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

export interface SettlementResponse {
  id: string;
  messId: string;
  member: UserBasicInfo;
  amount: number;
  type: SettlementType;
  description?: string;
  date: Date;
  recordedBy: UserBasicInfo;
  createdAt: Date;
}

export interface SettlementSuggestion {
  member: UserBasicInfo;
  action: 'pay' | 'receive'; // pay = contribute to mess, receive = get refund from mess
  amount: number;
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
 * SettlementService handles settlement recording and suggestions for mess fund system
 */
class SettlementService {
  /**
   * Record a contribution to mess fund
   */
  async recordContribution(
    userId: string,
    contributionData: RecordContributionDTO
  ): Promise<SettlementResponse> {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Validate mess ID
    if (!mongoose.Types.ObjectId.isValid(contributionData.messId)) {
      throw new Error('Invalid mess ID');
    }

    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(contributionData.memberId)) {
      throw new Error('Invalid member ID');
    }

    // Validate amount is positive
    if (contributionData.amount <= 0) {
      throw new Error('Contribution amount must be positive');
    }

    // Verify user is a member of the mess
    const mess = await Mess.findById(contributionData.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isMember = mess.members.some((m) => m.userId.equals(userObjectId));
    if (!isMember) {
      throw new Error('User is not a member of this mess');
    }

    // Verify memberId is a member
    const memberObjectId = new mongoose.Types.ObjectId(contributionData.memberId);
    const isMemberValid = mess.members.some((m) => m.userId.equals(memberObjectId));
    if (!isMemberValid) {
      throw new Error('Member must be a member of the mess');
    }

    // Round amount to 2 decimal places
    const roundedAmount = Math.round(contributionData.amount * 100) / 100;

    // Create settlement document
    const settlement = new Settlement({
      messId: new mongoose.Types.ObjectId(contributionData.messId),
      memberId: memberObjectId,
      amount: roundedAmount,
      type: 'contribution',
      description: contributionData.description,
      date: contributionData.date || new Date(),
      recordedBy: userObjectId,
      isDeleted: false,
    });

    // Save settlement
    await settlement.save();

    // Log activity
    await activityLogService.logSettlementActivity(
      contributionData.messId,
      userId,
      settlement._id.toString(),
      {
        memberId: contributionData.memberId,
        amount: roundedAmount,
        type: 'contribution',
        description: contributionData.description,
      }
    );

    // Return formatted response
    return this.formatSettlementResponse(settlement);
  }

  /**
   * Record a refund from mess fund
   */
  async recordRefund(
    userId: string,
    refundData: RecordRefundDTO
  ): Promise<SettlementResponse> {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Validate mess ID
    if (!mongoose.Types.ObjectId.isValid(refundData.messId)) {
      throw new Error('Invalid mess ID');
    }

    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(refundData.memberId)) {
      throw new Error('Invalid member ID');
    }

    // Validate amount is positive
    if (refundData.amount <= 0) {
      throw new Error('Refund amount must be positive');
    }

    // Verify user is Owner or Admin (only they can issue refunds)
    const userRole = await authorizationService.getUserRole(userId, refundData.messId);
    if (userRole !== 'Owner' && userRole !== 'Admin') {
      throw new Error('Unauthorized: Only Owner or Admin can issue refunds');
    }

    // Verify mess has enough balance
    const messFund = await balanceService.getMessFundBalance(refundData.messId);
    if (messFund.balance < refundData.amount) {
      throw new Error(
        `Insufficient mess fund balance. Available: ${messFund.balance}, Requested: ${refundData.amount}`
      );
    }

    // Verify member is a member of the mess
    const mess = await Mess.findById(refundData.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    const memberObjectId = new mongoose.Types.ObjectId(refundData.memberId);
    const isMemberValid = mess.members.some((m) => m.userId.equals(memberObjectId));
    if (!isMemberValid) {
      throw new Error('Member must be a member of the mess');
    }

    // Round amount to 2 decimal places
    const roundedAmount = Math.round(refundData.amount * 100) / 100;

    // Create settlement document
    const settlement = new Settlement({
      messId: new mongoose.Types.ObjectId(refundData.messId),
      memberId: memberObjectId,
      amount: roundedAmount,
      type: 'refund',
      description: refundData.description,
      date: refundData.date || new Date(),
      recordedBy: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    });

    // Save settlement
    await settlement.save();

    // Log activity
    await activityLogService.logSettlementActivity(
      refundData.messId,
      userId,
      settlement._id.toString(),
      {
        memberId: refundData.memberId,
        amount: roundedAmount,
        type: 'refund',
        description: refundData.description,
      }
    );

    // Return formatted response
    return this.formatSettlementResponse(settlement);
  }

  /**
   * Get settlements with role-based filtering and pagination
   */
  async getSettlements(
    messId: string,
    userId: string,
    filters: SettlementFilters = {}
  ): Promise<PaginatedResponse<SettlementResponse>> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Verify user is a member of the mess
    const userRole = await authorizationService.getUserRole(userId, messId);
    if (!userRole) {
      throw new Error('Unauthorized: You are not a member of this mess');
    }

    // Build query
    const query: any = {
      messId: new mongoose.Types.ObjectId(messId),
      isDeleted: false,
    };

    // Role-based filtering
    // Owner/Admin: Can view all settlements
    // Member: Can only view settlements involving themselves
    if (userRole === 'Member') {
      query.memberId = new mongoose.Types.ObjectId(userId);
    }

    // Apply additional filters
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    // Filter by member ID
    if (filters.memberId) {
      if (!mongoose.Types.ObjectId.isValid(filters.memberId)) {
        throw new Error('Invalid filter member ID');
      }

      // If Member role, ensure they can only filter their own settlements
      if (userRole === 'Member' && filters.memberId !== userId) {
        throw new Error('Unauthorized: Members can only view their own settlements');
      }

      query.memberId = new mongoose.Types.ObjectId(filters.memberId);
    }

    // Filter by type
    if (filters.type) {
      query.type = filters.type;
    }

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Cap at 100
    const skip = (page - 1) * limit;

    // Execute query
    const [settlements, totalCount] = await Promise.all([
      Settlement.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Settlement.countDocuments(query),
    ]);

    // Format responses
    const data = await Promise.all(
      settlements.map((settlement) =>
        this.formatSettlementResponse(settlement as ISettlement)
      )
    );

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

  /**
   * Get settlement suggestions based on member balances
   */
  async getSettlementSuggestions(
    messId: string,
    userId: string
  ): Promise<SettlementSuggestion[]> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Verify user is a member of the mess
    const userRole = await authorizationService.getUserRole(userId, messId);
    if (!userRole) {
      throw new Error('Unauthorized: You are not a member of this mess');
    }

    // Get all member balances
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Calculate balances for all members
    const balances = await Promise.all(
      mess.members.map(async (member) => {
        const balance = await balanceService.calculateMemberBalance(
          messId,
          member.userId.toString()
        );
        return balance;
      })
    );

    // Get user information for all members
    const userIds = balances.map((b) => b.userId);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Create suggestions for members with non-zero balances
    const suggestions: SettlementSuggestion[] = balances
      .filter((b) => Math.abs(b.balance) > 1) // Ignore small amounts
      .map((b) => {
        const user = userMap.get(b.userId);
        const action: 'pay' | 'receive' = b.balance > 0 ? 'receive' : 'pay';
        return {
          member: {
            id: b.userId,
            name: user?.name || 'Unknown',
            email: user?.email || '',
          },
          action,
          amount: Math.abs(b.balance),
        };
      })
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    return suggestions;
  }

  /**
   * Format settlement document to response DTO
   */
  private async formatSettlementResponse(
    settlement: ISettlement
  ): Promise<SettlementResponse> {
    // Get user information for member and recordedBy
    const userIds = [
      settlement.memberId.toString(),
      settlement.recordedBy.toString(),
    ];

    const uniqueUserIds = [...new Set(userIds)];
    const users = await User.find({ _id: { $in: uniqueUserIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Format member
    const memberUser = userMap.get(settlement.memberId.toString());
    const member: UserBasicInfo = {
      id: settlement.memberId.toString(),
      name: memberUser?.name || 'Unknown',
      email: memberUser?.email || '',
    };

    // Format recordedBy
    const recordedByUser = userMap.get(settlement.recordedBy.toString());
    const recordedBy: UserBasicInfo = {
      id: settlement.recordedBy.toString(),
      name: recordedByUser?.name || 'Unknown',
      email: recordedByUser?.email || '',
    };

    return {
      id: settlement._id.toString(),
      messId: settlement.messId.toString(),
      member,
      amount: settlement.amount,
      type: settlement.type,
      description: settlement.description,
      date: settlement.date,
      recordedBy,
      createdAt: settlement.createdAt,
    };
  }
}

// Export singleton instance
export default new SettlementService();
