import mongoose from 'mongoose';
import Expense, { IExpense, ExpenseCategory, SplitMethod } from '../models/Expense';
import Mess from '../models/Mess';
import User from '../models/User';
import authorizationService from './authorization.service';
import activityLogService from './activityLog.service';
import {
  calculateSplits,
  SplitInput,
  SplitResult,
} from '../utils/expenseSplit';

/**
 * DTOs for ExpenseService
 */
export interface CreateExpenseDTO {
  messId: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  paidBy: string;
  splitMethod: SplitMethod;
  splits?: SplitInput[];
  excludedMembers?: string[];
}

export interface UpdateExpenseDTO {
  amount?: number;
  description?: string;
  category?: ExpenseCategory;
  date?: Date;
  paidBy?: string;
  splitMethod?: SplitMethod;
  splits?: SplitInput[];
  excludedMembers?: string[];
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  category?: ExpenseCategory;
  memberId?: string;
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

export interface SplitInfo {
  user: UserBasicInfo;
  amount: number;
  percentage?: number;
}

export interface ExpenseResponse {
  id: string;
  messId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  paidBy: UserBasicInfo;
  splitMethod: string;
  splits: SplitInfo[];
  createdBy: UserBasicInfo;
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
 * ExpenseService handles expense CRUD operations, split calculations,
 * and balance updates
 * 
 * Requirements: 5.1, 5.8, 5.9, 5.10, 12.1, 12.2, 12.3
 */
class ExpenseService {
  /**
   * Create a new expense with split calculation and balance updates
   * @param userId - User ID creating the expense
   * @param expenseData - Expense data
   * @returns Created expense response
   * 
   * Requirements: 5.1, 5.10, 6.1
   * Property 18: Expense Creation and Balance Update
   */
  async createExpense(
    userId: string,
    expenseData: CreateExpenseDTO
  ): Promise<ExpenseResponse> {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Validate mess ID
    if (!mongoose.Types.ObjectId.isValid(expenseData.messId)) {
      throw new Error('Invalid mess ID');
    }

    // Verify user is a member of the mess
    const mess = await Mess.findById(expenseData.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isMember = mess.members.some((m) => m.userId.equals(userObjectId));
    if (!isMember) {
      throw new Error('User is not a member of this mess');
    }

    // Validate paidBy is a member
    const paidByObjectId = new mongoose.Types.ObjectId(expenseData.paidBy);
    const isPaidByMember = mess.members.some((m) =>
      m.userId.equals(paidByObjectId)
    );
    if (!isPaidByMember) {
      throw new Error('Payer must be a member of the mess');
    }

    // Get all member IDs for split calculation
    const allMemberIds = mess.members.map((m) => m.userId.toString());

    // Calculate splits based on split method
    let calculatedSplits: SplitResult[];

    try {
      calculatedSplits = calculateSplits(
        expenseData.splitMethod,
        expenseData.amount,
        allMemberIds,
        expenseData.splits,
        expenseData.excludedMembers
      );
    } catch (error) {
      throw new Error(`Split calculation failed: ${(error as Error).message}`);
    }

    // Validate all split user IDs are members
    for (const split of calculatedSplits) {
      const isSplitMember = mess.members.some((m) =>
        m.userId.equals(split.memberId)
      );
      if (!isSplitMember) {
        throw new Error('All split members must be members of the mess');
      }
    }

    // Create expense document
    const expense = new Expense({
      messId: new mongoose.Types.ObjectId(expenseData.messId),
      amount: expenseData.amount,
      description: expenseData.description,
      category: expenseData.category,
      date: expenseData.date,
      paidBy: paidByObjectId,
      splitMethod: expenseData.splitMethod,
      splits: calculatedSplits,
      createdBy: userObjectId,
      isDeleted: false,
    });

    // Save expense
    await expense.save();

    // Log activity
    await activityLogService.logExpenseActivity(
      expenseData.messId,
      userId,
      'created',
      expense._id.toString(),
      {
        amount: expenseData.amount,
        description: expenseData.description,
        category: expenseData.category,
        splitMethod: expenseData.splitMethod,
      }
    );

    // Return formatted response
    return this.formatExpenseResponse(expense);
  }

  /**
   * Update an existing expense with authorization and balance recalculation
   * @param expenseId - Expense ID to update
   * @param userId - User ID performing the update
   * @param updates - Expense updates
   * @returns Updated expense response
   * 
   * Requirements: 5.8, 5.10
   * Property 23: Expense Modification Balance Recalculation
   */
  async updateExpense(
    expenseId: string,
    userId: string,
    updates: UpdateExpenseDTO
  ): Promise<ExpenseResponse> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new Error('Invalid expense ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Find expense
    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted) {
      throw new Error('Expense not found');
    }

    // Check authorization
    const canEdit = await authorizationService.canEditExpense(userId, expenseId);
    if (!canEdit) {
      throw new Error('Unauthorized: You do not have permission to edit this expense');
    }

    // Get mess for validation
    const mess = await Mess.findById(expense.messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // If paidBy is being updated, validate it's a member
    if (updates.paidBy) {
      const paidByObjectId = new mongoose.Types.ObjectId(updates.paidBy);
      const isPaidByMember = mess.members.some((m) =>
        m.userId.equals(paidByObjectId)
      );
      if (!isPaidByMember) {
        throw new Error('Payer must be a member of the mess');
      }
      expense.paidBy = paidByObjectId;
    }

    // Update basic fields
    if (updates.amount !== undefined) expense.amount = updates.amount;
    if (updates.description !== undefined) expense.description = updates.description;
    if (updates.category !== undefined) expense.category = updates.category;
    if (updates.date !== undefined) expense.date = updates.date;

    // If split method or splits are being updated, recalculate
    if (updates.splitMethod || updates.splits || updates.excludedMembers) {
      const splitMethod = updates.splitMethod || expense.splitMethod;
      const amount = updates.amount !== undefined ? updates.amount : expense.amount;
      const allMemberIds = mess.members.map((m) => m.userId.toString());

      let calculatedSplits: SplitResult[];

      try {
        calculatedSplits = calculateSplits(
          splitMethod,
          amount,
          allMemberIds,
          updates.splits,
          updates.excludedMembers
        );
      } catch (error) {
        throw new Error(`Split calculation failed: ${(error as Error).message}`);
      }

      expense.splitMethod = splitMethod;
      expense.splits = calculatedSplits;
    } else if (updates.amount !== undefined) {
      // If only amount changed, recalculate splits with same method
      const allMemberIds = mess.members.map((m) => m.userId.toString());

      // For equal split, we need to recalculate
      if (expense.splitMethod === 'equal') {
        const includedMemberIds = expense.splits.map((s) => s.memberId.toString());
        const excludedMemberIds = allMemberIds.filter(
          (id) => !includedMemberIds.includes(id)
        );

        const calculatedSplits = calculateSplits(
          'equal',
          updates.amount,
          allMemberIds,
          undefined,
          excludedMemberIds
        );

        expense.splits = calculatedSplits;
      } else {
        // For custom split, we need the original split configuration
        // This is a limitation - we'll throw an error
        throw new Error(
          'Cannot update amount for custom split without providing new split configuration'
        );
      }
    }

    // Save updated expense
    await expense.save();

    // Log activity
    await activityLogService.logExpenseActivity(
      expense.messId.toString(),
      userId,
      'updated',
      expenseId,
      {
        updates,
      }
    );

    // Return formatted response
    return this.formatExpenseResponse(expense);
  }

  /**
   * Delete an expense (soft delete) with balance recalculation
   * @param expenseId - Expense ID to delete
   * @param userId - User ID performing the deletion
   * 
   * Requirements: 5.9, 5.10
   */
  async deleteExpense(expenseId: string, userId: string): Promise<void> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new Error('Invalid expense ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Find expense
    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted) {
      throw new Error('Expense not found');
    }

    // Check authorization
    const canEdit = await authorizationService.canEditExpense(userId, expenseId);
    if (!canEdit) {
      throw new Error('Unauthorized: You do not have permission to delete this expense');
    }

    // Soft delete
    expense.isDeleted = true;
    expense.deletedAt = new Date();
    await expense.save();

    // Log activity
    await activityLogService.logExpenseActivity(
      expense.messId.toString(),
      userId,
      'deleted',
      expenseId,
      {
        amount: expense.amount,
        description: expense.description,
      }
    );
  }

  /**
   * Get a single expense with authorization
   * @param expenseId - Expense ID
   * @param userId - User ID requesting the expense
   * @returns Expense response
   * 
   * Requirements: 5.8
   */
  async getExpense(expenseId: string, userId: string): Promise<ExpenseResponse> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new Error('Invalid expense ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Find expense
    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted) {
      throw new Error('Expense not found');
    }

    // Verify user is a member of the mess
    const userRole = await authorizationService.getUserRole(
      userId,
      expense.messId.toString()
    );

    if (!userRole) {
      throw new Error('Unauthorized: You are not a member of this mess');
    }

    // Return formatted response
    return this.formatExpenseResponse(expense);
  }

  /**
   * Get expenses with pagination, filtering, and sorting
   * @param messId - Mess ID
   * @param userId - User ID requesting expenses
   * @param filters - Pagination and filtering options
   * @returns Paginated expense response
   * 
   * Requirements: 12.1, 12.2, 12.3
   */
  async getExpenses(
    messId: string,
    userId: string,
    filters: ExpenseFilters = {}
  ): Promise<PaginatedResponse<ExpenseResponse>> {
    console.log('getExpenses called with:', { messId, userId, filters });
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

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.memberId) {
      if (!mongoose.Types.ObjectId.isValid(filters.memberId)) {
        throw new Error('Invalid member ID');
      }
      // Filter expenses where member is either payer or in splits
      const memberObjectId = new mongoose.Types.ObjectId(filters.memberId);
      query.$or = [
        { paidBy: memberObjectId },
        { 'splits.memberId': memberObjectId },
      ];
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
    const [expenses, totalCount] = await Promise.all([
      Expense.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Expense.countDocuments(query),
    ]);

    // Format responses
    const data = await Promise.all(
      expenses.map((expense) => this.formatExpenseResponse(expense as IExpense))
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
   * Format expense document to response DTO
   * @param expense - Expense document
   * @returns Formatted expense response
   */
  private async formatExpenseResponse(expense: IExpense): Promise<ExpenseResponse> {
    // Get user information for paidBy, createdBy, and all splits
    const userIds = [
      expense.paidBy.toString(),
      expense.createdBy.toString(),
      ...expense.splits.map((s) => s.memberId.toString()),
    ];

    const uniqueUserIds = [...new Set(userIds)];
    const users = await User.find({ _id: { $in: uniqueUserIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Format paidBy
    const paidByUser = userMap.get(expense.paidBy.toString());
    const paidBy: UserBasicInfo = {
      id: expense.paidBy.toString(),
      name: paidByUser?.name || 'Unknown',
      email: paidByUser?.email || '',
    };

    // Format createdBy
    const createdByUser = userMap.get(expense.createdBy.toString());
    const createdBy: UserBasicInfo = {
      id: expense.createdBy.toString(),
      name: createdByUser?.name || 'Unknown',
      email: createdByUser?.email || '',
    };

    // Format splits
    const splits: SplitInfo[] = expense.splits.map((split) => {
      const user = userMap.get(split.memberId.toString());
      return {
        user: {
          id: split.memberId.toString(),
          name: user?.name || 'Unknown',
          email: user?.email || '',
        },
        amount: split.amount,
        percentage: split.percentage,
      };
    });

    return {
      id: expense._id.toString(),
      messId: expense.messId.toString(),
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      date: expense.date,
      paidBy,
      splitMethod: expense.splitMethod,
      splits,
      createdBy,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}

// Export singleton instance
export default new ExpenseService();
