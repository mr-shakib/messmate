import mongoose from 'mongoose';
import Expense from '../models/Expense';
import Settlement from '../models/Settlement';
import Mess from '../models/Mess';
import User from '../models/User';
import authorizationService from './authorization.service';
import balanceService from './balance.service';

/**
 * DTOs for DashboardService
 */
export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TransactionInfo {
  type: 'expense' | 'settlement';
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface MemberAnalytics {
  userId: string;
  userName: string;
  totalPaid: number;
  totalShare: number;
  balance: number;
}

export interface DashboardResponse {
  currentMonthTotal: number;
  userBalance: number;
  categoryBreakdown: CategoryBreakdown[];
  recentTransactions: TransactionInfo[];
  memberAnalytics?: MemberAnalytics[]; // Only for Owner/Admin
}

/**
 * DashboardService handles dashboard data aggregation and analytics
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
class DashboardService {
  /**
   * Get comprehensive dashboard data for a user in a mess
   * 
   * @param messId - Mess ID
   * @param userId - User ID requesting dashboard
   * @returns Dashboard data with analytics
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
   * Property 39: Dashboard Data Accuracy
   * Property 40: Recent Transactions Limit
   */
  async getDashboardData(
    messId: string,
    userId: string
  ): Promise<DashboardResponse> {
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

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const messObjectId = new mongoose.Types.ObjectId(messId);

    // Calculate current month total (Requirement 8.1)
    const currentMonthExpenses = await Expense.find({
      messId: messObjectId,
      isDeleted: false,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).lean();

    const currentMonthTotal = currentMonthExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Calculate user balance (Requirement 8.2)
    const balanceResponse = await balanceService.calculateMemberBalance(messId, userId);
    const userBalance = balanceResponse.balance;

    // Generate category breakdown (Requirement 8.3)
    const categoryBreakdown = await this.calculateCategoryBreakdown(messId);

    // Fetch recent 10 transactions (Requirement 8.4)
    const recentTransactions = await this.getRecentTransactions(messId);

    // Include member analytics for Owner/Admin (Requirements 8.5, 8.6)
    let memberAnalytics: MemberAnalytics[] | undefined;
    if (userRole === 'Owner' || userRole === 'Admin') {
      memberAnalytics = await this.getMemberAnalytics(messId);
    }

    return {
      currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
      userBalance,
      categoryBreakdown,
      recentTransactions,
      memberAnalytics,
    };
  }

  /**
   * Calculate category breakdown with percentages
   * 
   * @param messId - Mess ID
   * @returns Array of category breakdowns
   * 
   * Requirement 8.3
   */
  private async calculateCategoryBreakdown(
    messId: string
  ): Promise<CategoryBreakdown[]> {
    const messObjectId = new mongoose.Types.ObjectId(messId);

    // Get all non-deleted expenses for the mess
    const expenses = await Expense.find({
      messId: messObjectId,
      isDeleted: false,
    }).lean();

    // Calculate total amount
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Group by category
    const categoryMap = new Map<string, { amount: number; count: number }>();

    for (const expense of expenses) {
      const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1,
      });
    }

    // Convert to array with percentages
    const breakdown: CategoryBreakdown[] = [];

    for (const [category, data] of categoryMap.entries()) {
      const percentage = totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0;

      breakdown.push({
        category,
        amount: Math.round(data.amount * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        count: data.count,
      });
    }

    // Sort by amount descending
    breakdown.sort((a, b) => b.amount - a.amount);

    return breakdown;
  }

  /**
   * Get recent 10 transactions (expenses and settlements)
   * 
   * @param messId - Mess ID
   * @returns Array of recent transactions
   * 
   * Requirement 8.4
   * Property 40: Recent Transactions Limit
   */
  private async getRecentTransactions(
    messId: string
  ): Promise<TransactionInfo[]> {
    const messObjectId = new mongoose.Types.ObjectId(messId);

    // Get recent expenses
    const recentExpenses = await Expense.find({
      messId: messObjectId,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Get recent settlements
    const recentSettlements = await Settlement.find({
      messId: messObjectId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Combine and format transactions
    const transactions: TransactionInfo[] = [];

    // Add expenses
    for (const expense of recentExpenses) {
      transactions.push({
        type: 'expense',
        id: expense._id.toString(),
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
      });
    }

    // Add settlements
    for (const settlement of recentSettlements) {
      transactions.push({
        type: 'settlement',
        id: settlement._id.toString(),
        description: settlement.description || 'Settlement',
        amount: settlement.amount,
        date: settlement.createdAt,
      });
    }

    // Sort by date descending and take top 10
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return transactions.slice(0, 10);
  }

  /**
   * Get member analytics for all members (Owner/Admin only)
   * 
   * @param messId - Mess ID
   * @returns Array of member analytics
   * 
   * Requirements 8.5, 8.6
   */
  private async getMemberAnalytics(messId: string): Promise<MemberAnalytics[]> {
    const messObjectId = new mongoose.Types.ObjectId(messId);

    // Get mess and all members
    const mess = await Mess.findById(messObjectId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Calculate analytics for each member
    const analytics: MemberAnalytics[] = [];

    for (const member of mess.members) {
      const userId = member.userId.toString();

      // Get user information
      const user = await User.findById(userId);
      if (!user) {
        continue; // Skip if user not found
      }

      // Calculate total paid by member
      const paidExpenses = await Expense.find({
        messId: messObjectId,
        paidBy: member.userId,
        isDeleted: false,
      }).lean();

      const totalPaid = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Calculate total share for member
      const allExpenses = await Expense.find({
        messId: messObjectId,
        isDeleted: false,
        'splits.memberId': member.userId,
      }).lean();

      const totalShare = allExpenses.reduce((sum, expense) => {
        const userSplit = expense.splits.find((s) => s.memberId.equals(member.userId));
        return sum + (userSplit?.amount || 0);
      }, 0);

      // Get balance from balance service
      const balanceResponse = await balanceService.calculateMemberBalance(
        messId,
        userId
      );

      analytics.push({
        userId,
        userName: user.name,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalShare: Math.round(totalShare * 100) / 100,
        balance: balanceResponse.balance,
      });
    }

    // Sort by balance descending (highest owed first)
    analytics.sort((a, b) => b.balance - a.balance);

    return analytics;
  }
}

// Export singleton instance
export default new DashboardService();
