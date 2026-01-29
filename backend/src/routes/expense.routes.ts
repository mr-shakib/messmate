import { Router } from 'express';
import { body, param, query } from 'express-validator';
import expenseController from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All expense routes require authentication
router.use(authenticate);

// Validation rules
const createExpenseValidation = [
  body('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Groceries', 'Utilities', 'Rent', 'Food', 'Entertainment', 'Other'])
    .withMessage('Invalid category'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('paidBy')
    .notEmpty()
    .withMessage('Payer is required')
    .isMongoId()
    .withMessage('Invalid payer ID format'),
  body('splitMethod')
    .notEmpty()
    .withMessage('Split method is required')
    .isIn(['equal', 'unequal', 'percentage'])
    .withMessage('Invalid split method'),
  body('splits')
    .optional()
    .isArray()
    .withMessage('Splits must be an array'),
  body('excludedMembers')
    .optional()
    .isArray()
    .withMessage('Excluded members must be an array'),
];

const updateExpenseValidation = [
  param('id')
    .notEmpty()
    .withMessage('Expense ID is required')
    .isMongoId()
    .withMessage('Invalid expense ID format'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  body('category')
    .optional()
    .isIn(['Groceries', 'Utilities', 'Rent', 'Food', 'Entertainment', 'Other'])
    .withMessage('Invalid category'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('paidBy')
    .optional()
    .isMongoId()
    .withMessage('Invalid payer ID format'),
  body('splitMethod')
    .optional()
    .isIn(['equal', 'unequal', 'percentage'])
    .withMessage('Invalid split method'),
  body('splits')
    .optional()
    .isArray()
    .withMessage('Splits must be an array'),
  body('excludedMembers')
    .optional()
    .isArray()
    .withMessage('Excluded members must be an array'),
];

const expenseIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Expense ID is required')
    .isMongoId()
    .withMessage('Invalid expense ID format'),
];

const getExpensesValidation = [
  query('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('category')
    .optional()
    .isIn(['Groceries', 'Utilities', 'Rent', 'Food', 'Entertainment', 'Other'])
    .withMessage('Invalid category'),
  query('memberId')
    .optional()
    .isMongoId()
    .withMessage('Invalid member ID format'),
  query('sortBy')
    .optional()
    .isIn(['date', 'amount', 'category'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Invalid sort order'),
];

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense
 * @access  Private
 */
router.post(
  '/',
  createExpenseValidation,
  validate,
  expenseController.createExpense.bind(expenseController)
);

/**
 * @route   GET /api/expenses
 * @desc    Get expenses with pagination, filtering, and sorting
 * @access  Private
 */
router.get(
  '/',
  getExpensesValidation,
  validate,
  expenseController.getExpenses.bind(expenseController)
);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense details
 * @access  Private
 */
router.get(
  '/:id',
  expenseIdValidation,
  validate,
  expenseController.getExpense.bind(expenseController)
);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense
 * @access  Private (Owner, Admin, or creator)
 */
router.put(
  '/:id',
  updateExpenseValidation,
  validate,
  expenseController.updateExpense.bind(expenseController)
);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense (soft delete)
 * @access  Private (Owner, Admin, or creator)
 */
router.delete(
  '/:id',
  expenseIdValidation,
  validate,
  expenseController.deleteExpense.bind(expenseController)
);

export default router;
