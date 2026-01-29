import mongoose from 'mongoose';
import { MoneyCollection, IMoneyCollection } from '../models/moneyCollection.model';
import Mess from '../models/Mess';
import User from '../models/User';
import authorizationService from './authorization.service';
import activityLogService from './activityLog.service';

/**
 * DTOs for MoneyCollectionService
 */
export interface RecordCollectionDTO {
  messId: string;
  memberId: string;
  amount: number;
  date?: Date;
  description?: string;
}

export interface CollectionFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  memberId?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

export interface CollectionResponse {
  id: string;
  messId: string;
  member: UserBasicInfo;
  amount: number;
  date: Date;
  description: string;
  collectedBy: UserBasicInfo;
  createdAt: Date;
  updatedAt: Date;
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
 * MoneyCollectionService handles money collection operations
 */
class MoneyCollectionService {
  /**
   * Record a money collection
   */
  async recordCollection(
    userId: string,
    collectionData: RecordCollectionDTO
  ): Promise<CollectionResponse> {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Validate mess ID
    if (!mongoose.Types.ObjectId.isValid(collectionData.messId)) {
      throw new Error('Invalid mess ID');
    }

    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(collectionData.memberId)) {
      throw new Error('Invalid member ID');
    }

    // Validate amount
    if (collectionData.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Verify user is a member of the mess
    const mess = await Mess.findById(collectionData.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isMember = mess.members.some((m) => m.userId.equals(userObjectId));
    if (!isMember) {
      throw new Error('User is not a member of this mess');
    }

    // Verify memberId is a member of the mess
    const memberObjectId = new mongoose.Types.ObjectId(collectionData.memberId);
    const isMemberValid = mess.members.some((m) => m.userId.equals(memberObjectId));
    if (!isMemberValid) {
      throw new Error('Member must be a member of the mess');
    }

    // Create collection document
    const collection = new MoneyCollection({
      messId: new mongoose.Types.ObjectId(collectionData.messId),
      memberId: memberObjectId,
      amount: collectionData.amount,
      date: collectionData.date || new Date(),
      description: collectionData.description || 'Monthly contribution',
      collectedBy: userObjectId,
    });

    // Save collection
    await collection.save();

    // Log activity
    try {
      await activityLogService.logExpenseActivity(
        collectionData.messId,
        userId,
        'created',
        collection._id.toString(),
        {
          collectionId: collection._id.toString(),
          memberId: collectionData.memberId,
          amount: collectionData.amount,
          description: collection.description,
        }
      );
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to log collection activity:', error);
    }

    // Return formatted response
    return this.formatCollectionResponse(collection);
  }

  /**
   * Get collections with pagination and filtering
   */
  async getCollections(
    messId: string,
    userId: string,
    filters: CollectionFilters = {}
  ): Promise<PaginatedResponse<CollectionResponse>> {
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
    };

    // Apply filters
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    if (filters.memberId) {
      if (!mongoose.Types.ObjectId.isValid(filters.memberId)) {
        throw new Error('Invalid member ID');
      }
      query.memberId = new mongoose.Types.ObjectId(filters.memberId);
    }

    // Pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Cap at 100
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    // Execute query
    const [collections, totalCount] = await Promise.all([
      MoneyCollection.find(query).sort(sort).skip(skip).limit(limit).lean(),
      MoneyCollection.countDocuments(query),
    ]);

    // Format responses
    const data = await Promise.all(
      collections.map((collection) =>
        this.formatCollectionResponse(collection as IMoneyCollection)
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
   * Get total collected for a mess
   */
  async getTotalCollected(
    messId: string,
    period?: { startDate: Date; endDate: Date }
  ): Promise<number> {
    // Validate mess ID
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }

    // Build query
    const query: any = {
      messId: new mongoose.Types.ObjectId(messId),
    };

    // Apply period filter
    if (period) {
      query.date = {};
      if (period.startDate) {
        query.date.$gte = period.startDate;
      }
      if (period.endDate) {
        query.date.$lte = period.endDate;
      }
    }

    // Aggregate total
    const result = await MoneyCollection.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Get member's total contributions
   */
  async getMemberContributions(messId: string, memberId: string): Promise<number> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw new Error('Invalid member ID');
    }

    // Aggregate total
    const result = await MoneyCollection.aggregate([
      {
        $match: {
          messId: new mongoose.Types.ObjectId(messId),
          memberId: new mongoose.Types.ObjectId(memberId),
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Delete a collection (Owner only)
   */
  async deleteCollection(collectionId: string, userId: string): Promise<void> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      throw new Error('Invalid collection ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Find collection
    const collection = await MoneyCollection.findById(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check authorization (only Owner can delete)
    const userRole = await authorizationService.getUserRole(
      userId,
      collection.messId.toString()
    );

    if (userRole !== 'Owner') {
      throw new Error('Unauthorized: Only mess owner can delete collections');
    }

    // Delete collection
    await MoneyCollection.findByIdAndDelete(collectionId);

    // Log activity
    try {
      await activityLogService.logExpenseActivity(
        collection.messId.toString(),
        userId,
        'deleted',
        collectionId,
        {
          collectionId,
          memberId: collection.memberId.toString(),
          amount: collection.amount,
        }
      );
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to log collection deletion:', error);
    }
  }

  /**
   * Format collection document to response DTO
   */
  private async formatCollectionResponse(
    collection: IMoneyCollection
  ): Promise<CollectionResponse> {
    // Get user information for member and collectedBy
    const userIds = [
      collection.memberId.toString(),
      collection.collectedBy.toString(),
    ];

    const uniqueUserIds = [...new Set(userIds)];
    const users = await User.find({ _id: { $in: uniqueUserIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Format member
    const memberUser = userMap.get(collection.memberId.toString());
    const member: UserBasicInfo = {
      id: collection.memberId.toString(),
      name: memberUser?.name || 'Unknown',
      email: memberUser?.email || '',
    };

    // Format collectedBy
    const collectedByUser = userMap.get(collection.collectedBy.toString());
    const collectedBy: UserBasicInfo = {
      id: collection.collectedBy.toString(),
      name: collectedByUser?.name || 'Unknown',
      email: collectedByUser?.email || '',
    };

    return {
      id: collection._id.toString(),
      messId: collection.messId.toString(),
      member,
      amount: collection.amount,
      date: collection.date,
      description: collection.description,
      collectedBy,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }
}

// Export singleton instance
export default new MoneyCollectionService();
