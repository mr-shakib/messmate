import mongoose from 'mongoose';
import Mess from '../models/Mess';
import Expense from '../models/Expense';
import Settlement from '../models/Settlement';

/**
 * AuthorizationService handles role-based permission checking
 * and resource access control for the mess management system.
 * 
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
 */
class AuthorizationService {
  /**
   * Check if user can manage mess (Owner only)
   * @param userId - User ID to check
   * @param messId - Mess ID
   * @returns true if user is Owner, false otherwise
   */
  async canManageMess(userId: string, messId: string): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId, messId);
      return role === 'Owner';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can manage expenses (Owner or Admin)
   * @param userId - User ID to check
   * @param messId - Mess ID
   * @returns true if user is Owner or Admin, false otherwise
   */
  async canManageExpenses(userId: string, messId: string): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId, messId);
      return role === 'Owner' || role === 'Admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can edit a specific expense (Owner, Admin, or creator)
   * @param userId - User ID to check
   * @param expenseId - Expense ID
   * @returns true if user is Owner, Admin, or expense creator, false otherwise
   */
  async canEditExpense(userId: string, expenseId: string): Promise<boolean> {
    try {
      // Validate expense ID format
      if (!mongoose.Types.ObjectId.isValid(expenseId)) {
        return false;
      }

      // Find the expense
      const expense = await Expense.findById(expenseId);
      if (!expense || expense.isDeleted) {
        return false;
      }

      // Check if user is the creator
      if (expense.createdBy.toString() === userId) {
        return true;
      }

      // Check if user is Owner or Admin of the mess
      const role = await this.getUserRole(userId, expense.messId.toString());
      return role === 'Owner' || role === 'Admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can view all balances (Owner or Admin)
   * @param userId - User ID to check
   * @param messId - Mess ID
   * @returns true if user is Owner or Admin, false otherwise
   */
  async canViewAllBalances(userId: string, messId: string): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId, messId);
      return role === 'Owner' || role === 'Admin';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can view settlements with role-based filtering
   * @param userId - User ID to check
   * @param messId - Mess ID
   * @param settlementId - Optional settlement ID for specific settlement check
   * @returns true if user has permission to view, false otherwise
   * 
   * Rules:
   * - Owner/Admin: Can view all settlements
   * - Member: Can only view settlements involving themselves
   */
  async canViewSettlements(
    userId: string,
    messId: string,
    settlementId?: string
  ): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId, messId);

      // Owner and Admin can view all settlements
      if (role === 'Owner' || role === 'Admin') {
        return true;
      }

      // Members can only view settlements involving themselves
      if (role === 'Member') {
        // If no specific settlement ID, allow (filtering will be done at service level)
        if (!settlementId) {
          return true;
        }

        // Validate settlement ID format
        if (!mongoose.Types.ObjectId.isValid(settlementId)) {
          return false;
        }

        // Check if settlement involves the user
        const settlement = await Settlement.findById(settlementId);
        if (!settlement || settlement.isDeleted) {
          return false;
        }

        // Verify settlement belongs to the correct mess
        if (settlement.messId.toString() !== messId) {
          return false;
        }

        // Check if user is involved in the settlement
        const userObjectId = new mongoose.Types.ObjectId(userId);
        return settlement.memberId.equals(userObjectId);
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can assign roles (Owner only)
   * @param userId - User ID to check
   * @param messId - Mess ID
   * @returns true if user is Owner, false otherwise
   */
  async canAssignRoles(userId: string, messId: string): Promise<boolean> {
    try {
      const role = await this.getUserRole(userId, messId);
      return role === 'Owner';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's role in a specific mess
   * @param userId - User ID
   * @param messId - Mess ID
   * @returns User's role ('Owner', 'Admin', or 'Member')
   * @throws Error if user is not a member of the mess or mess doesn't exist
   */
  async getUserRole(
    userId: string,
    messId: string
  ): Promise<'Owner' | 'Admin' | 'Member'> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    if (!mongoose.Types.ObjectId.isValid(messId)) {
      throw new Error('Invalid mess ID');
    }

    // Find the mess
    const mess = await Mess.findById(messId);
    if (!mess) {
      throw new Error('Mess not found');
    }

    // Find user in members array
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const member = mess.members.find((m) => m.userId.equals(userObjectId));

    if (!member) {
      throw new Error('User is not a member of this mess');
    }

    return member.role;
  }
}

// Export singleton instance
export default new AuthorizationService();
