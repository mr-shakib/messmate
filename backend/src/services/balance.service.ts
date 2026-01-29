import mongoose from 'mongoose';
import Expense from '../models/Expense';
import Settlement from '../models/Settlement';
import { MoneyCollection } from '../models/moneyCollection.model';
import Mess from '../models/Mess';
import User from '../models/User';
import authorizationService from './authorization.service';

/**
 * DTOs for BalanceService
 */
export interface MemberBalanceResponse {
  userId: string;
  userName: string;
  contributed: number; // Total money given to mess
  fairShare: number; // Total share of expenses
  paidFromPocket: number; // Expenses paid by member (needs reimbursement)
  balance: number; // contributed - fairShare + paidFromPocket
  status: 'owed' | 'owes' | 'settled'; // owed = mess owes member, owes = member owes mess
}

export interface MessFundBalanceResponse {
  totalCollected: number;
  totalExpenses: number;
  balance: number; // totalCollected - totalExpenses
}

export interface TransactionInfo {
  type: 'collection' | 'expense' | 'settlement';
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface BalanceBreakdown {
  userId: string;
  contributed: number;
  fairShare: number;
  paidFromPocket: number;
  balance: number;
  transactions: TransactionInfo[];
}

/**
 * BalanceService handles balance calculation for mess fund system
 * 
 * Formula: Member Balance = Contributed - Fair Share + Paid from Pocket
 */
class BalanceService {
  /**
   * Calculate mess fund balance
   * Formula: Total Collected - Total Expenses
   */
  async getMessFundBalance(messId: string): Promise<MessFundBalanceResponse> {
    // Validate mess ID
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }

    const messObjectId = new mongoose.Types.ObjectId(messId);

    // Get total collected
    const collections = await MoneyCollection.aggregate([
      { $match: { messId: messObjectId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalCollected = collections.length > 0 ? collections[0].total : 0;

    // Get total expenses
    const expenses = await Expense.aggregate([
      { $match: { messId: messObjectId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;

    // Calculate balance
    const balance = totalCollected - totalExpenses;

    return {
      totalCollected: Math.round(totalCollected * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    };
  }

  /**
   * Calculate a member's balance in a mess
   * Formula: Contributed - Fair Share + Paid from Pocket
   * 
   * @param messId - Mess ID
   * @param userId - User ID
   * @returns Balance response with breakdown
   */
  async calculateMemberBalance(
    messId: string,
    userId: string
  ): Promise<MemberBalanceResponse> {
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

    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const messObjectId = new mongoose.Types.ObjectId(messId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Calculate total contributed (money given to mess)
    const collections = await MoneyCollection.aggregate([
      {
        $match: {
          messId: messObjectId,
          memberId: userObjectId,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const contributed = collections.length > 0 ? collections[0].total : 0;

    // 2. Calculate fair share (sum of split amounts for this member)
    const allExpenses = await Expense.find({
      messId: messObjectId,
      isDeleted: false,
      'splits.memberId': userObjectId,
    }).lean();

    const fairShare = allExpenses.reduce((sum, expense) => {
      const memberSplit = expense.splits.find((s) => s.memberId.equals(userObjectId));
      return sum + (memberSplit?.amount || 0);
    }, 0);

    // 3. Calculate paid from pocket (expenses paid by member that need reimbursement)
    const paidExpenses = await Expense.find({
      messId: messObjectId,
      paidBy: userObjectId,
      isDeleted: false,
    }).lean();

    const paidFromPocket = paidExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // 4. Calculate balance: contributed - fairShare + paidFromPocket
    const balance = contributed - fairShare + paidFromPocket;

    // Round to 2 decimal places
    const roundedContributed = Math.round(contributed * 100) / 100;
    const roundedFairShare = Math.round(fairShare * 100) / 100;
    const roundedPaidFromPocket = Math.round(paidFromPocket * 100) / 100;
    const roundedBalance = Math.round(balance * 100) / 100;

    // Determine status
    let status: 'owed' | 'owes' | 'settled';
    if (roundedBalance > 1) {
      status = 'owed'; // Mess owes member (should get refund)
    } else if (roundedBalance < -1) {
      status = 'owes'; // Member owes mess (should contribute)
    } else {
      status = 'settled'; // Balance is settled
    }

    return {
      userId,
      userName: user.name,
      contributed: roundedContributed,
      fairShare: roundedFairShare,
      paidFromPocket: roundedPaidFromPocket,
      balance: roundedBalance,
      status,
    };
  }

  /**
   * Get balances for all members in a mess
   * 
   * @param messId - Mess ID
   * @param userId - User ID requesting balances (for authorization)
   * @returns Array of balance responses for all members
   */
  async getAllBalances(
    messId: string,
    userId: string
  ): Promise<MemberBalanceResponse[]> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Check authorization - only Owner or Admin can view all balances
    const canViewAll = await authorizationService.canViewAllBalances(userId, messId);
    if (!canViewAll) {
      throw new Error(
        'Unauthorized: Only Owner or Admin can view all member balances'
      );
    }

    // Get mess and all members
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Calculate balance for each member
    const balances = await Promise.all(
      mess.members.map((member) =>
        this.calculateMemberBalance(messId, member.userId.toString())
      )
    );

    return balances;
  }

  /**
   * Get detailed balance breakdown with transaction history
   * 
   * @param messId - Mess ID
   * @param userId - User ID
   * @returns Balance breakdown with transaction details
   */
  async getBalanceBreakdown(
    messId: string,
    userId: string
  ): Promise<BalanceBreakdown> {
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

    const messObjectId = new mongoose.Types.ObjectId(messId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get member balance
    const balance = await this.calculateMemberBalance(messId, userId);

    // Build transaction history
    const transactions: TransactionInfo[] = [];

    // 1. Add money collections
    const collections = await MoneyCollection.find({
      messId: messObjectId,
      memberId: userObjectId,
    })
      .sort({ date: -1 })
      .lean();

    for (const collection of collections) {
      transactions.push({
        type: 'collection',
        id: collection._id.toString(),
        description: collection.description,
        amount: collection.amount, // Positive (money given to mess)
        date: collection.date,
      });
    }

    // 2. Add expenses where member paid from pocket
    const paidExpenses = await Expense.find({
      messId: messObjectId,
      paidBy: userObjectId,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .lean();

    for (const expense of paidExpenses) {
      transactions.push({
        type: 'expense',
        id: expense._id.toString(),
        description: `Paid from pocket: ${expense.description}`,
        amount: expense.amount, // Positive (needs reimbursement)
        date: expense.date,
      });
    }

    // 3. Add expenses where member has a share
    const allExpenses = await Expense.find({
      messId: messObjectId,
      isDeleted: false,
      'splits.memberId': userObjectId,
    })
      .sort({ date: -1 })
      .lean();

    for (const expense of allExpenses) {
      const memberSplit = expense.splits.find((s) => s.memberId.equals(userObjectId));
      if (memberSplit) {
        transactions.push({
          type: 'expense',
          id: expense._id.toString(),
          description: `Your share: ${expense.description}`,
          amount: -memberSplit.amount, // Negative (cost to member)
          date: expense.date,
        });
      }
    }

    // 4. Add settlements
    const settlements = await Settlement.find({
      messId: messObjectId,
      memberId: userObjectId,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .lean();

    for (const settlement of settlements) {
      const amount =
        settlement.type === 'contribution'
          ? settlement.amount // Positive (money given to mess)
          : -settlement.amount; // Negative (money received from mess)

      transactions.push({
        type: 'settlement',
        id: settlement._id.toString(),
        description:
          settlement.description ||
          (settlement.type === 'contribution'
            ? 'Contribution to mess'
            : 'Refund from mess'),
        amount,
        date: settlement.date,
      });
    }

    // Sort transactions by date (most recent first)
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      userId,
      contributed: balance.contributed,
      fairShare: balance.fairShare,
      paidFromPocket: balance.paidFromPocket,
      balance: balance.balance,
      transactions,
    };
  }
}

// Export singleton instance
export default new BalanceService();
