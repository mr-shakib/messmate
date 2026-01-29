import { Router } from 'express';
import { param, query } from 'express-validator';
import balanceController from '../controllers/balance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All balance routes require authentication
router.use(authenticate);

// Validation rules
const messIdQueryValidation = [
  query('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
];

const balanceBreakdownValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  query('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
];

/**
 * @route   GET /api/balances/mess-fund
 * @desc    Get mess fund balance
 * @access  Private
 */
router.get(
  '/mess-fund',
  messIdQueryValidation,
  validate,
  balanceController.getMessFundBalance.bind(balanceController)
);

/**
 * @route   GET /api/balances/me
 * @desc    Get the authenticated user's balance in a mess
 * @access  Private
 */
router.get(
  '/me',
  messIdQueryValidation,
  validate,
  balanceController.getMyBalance.bind(balanceController)
);

/**
 * @route   GET /api/balances/:userId/breakdown
 * @desc    Get detailed balance breakdown for a user
 * @access  Private
 */
router.get(
  '/:userId/breakdown',
  balanceBreakdownValidation,
  validate,
  balanceController.getBalanceBreakdown.bind(balanceController)
);

/**
 * @route   GET /api/balances
 * @desc    Get all member balances in a mess (Owner/Admin only)
 * @access  Private (Owner/Admin only)
 */
router.get(
  '/',
  messIdQueryValidation,
  validate,
  balanceController.getAllBalances.bind(balanceController)
);

export default router;
