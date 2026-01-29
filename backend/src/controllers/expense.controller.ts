import { Request, Response, NextFunction } from 'express';
import expenseService from '../services/expense.service';
import { logger } from '../config/logger';

/**
 * Expense Controller
 * Handles HTTP requests for expense management operations
 */
class ExpenseController {
  /**
   * POST /api/expenses
   * Create a new expense
   */
  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const {
        messId,
        amount,
        description,
        category,
        date,
        paidBy,
        splitMethod,
        splits,
        excludedMembers,
      } = req.body;

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

      // Validate required fields
      if (!messId || !amount || !description || !category || !date || !paidBy || !splitMethod) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            timestamp: new Date(),
            path: req.path,
          },
        });
        return;
      }

      // Create expense
      const result = await expenseService.createExpense(userId, {
        messId,
        amount,
        description,
        category,
        date: new Date(date),
        paidBy,
        splitMethod,
        splits,
        excludedMembers,
      });

      logger.info(`Expense created: ${result.id} by user ${userId}`);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses
   * Get expenses with pagination, filtering, and sorting
   */
  async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const {
        messId,
        page,
        limit,
        startDate,
        endDate,
        category,
        memberId,
        sortBy,
        sortOrder,
      } = req.query;

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
      if (category) filters.category = category;
      if (memberId) filters.memberId = memberId;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;

      // Get expenses
      const result = await expenseService.getExpenses(
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
      console.error('Error in getExpenses:', error);
      next(error);
    }
  }

  /**
   * GET /api/expenses/:id
   * Get expense details
   */
  async getExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

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

      // Get expense
      const result = await expenseService.getExpense(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/expenses/:id
   * Update expense
   */
  async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const {
        amount,
        description,
        category,
        date,
        paidBy,
        splitMethod,
        splits,
        excludedMembers,
      } = req.body;

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

      // Build updates object
      const updates: any = {};
      if (amount !== undefined) updates.amount = amount;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (date !== undefined) updates.date = new Date(date);
      if (paidBy !== undefined) updates.paidBy = paidBy;
      if (splitMethod !== undefined) updates.splitMethod = splitMethod;
      if (splits !== undefined) updates.splits = splits;
      if (excludedMembers !== undefined) updates.excludedMembers = excludedMembers;

      // Update expense
      const result = await expenseService.updateExpense(id, userId, updates);

      logger.info(`Expense updated: ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/expenses/:id
   * Delete expense (soft delete)
   */
  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

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

      // Delete expense
      await expenseService.deleteExpense(id, userId);

      logger.info(`Expense deleted: ${id} by user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export default new ExpenseController();
