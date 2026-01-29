import { Router } from 'express';
import { body, query } from 'express-validator';
import settlementController from '../controllers/settlement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All settlement routes require authentication
router.use(authenticate);

// Validation rules
const recordContributionValidation = [
  body('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid member ID format'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

const recordRefundValidation = [
  body('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid member ID format'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

const getSettlementsValidation = [
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
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  query('type')
    .optional()
    .isIn(['contribution', 'refund'])
    .withMessage('Type must be either contribution or refund'),
];

const getSettlementSuggestionsValidation = [
  query('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
];

/**
 * @route   POST /api/settlements/contribution
 * @desc    Record a contribution to mess fund
 * @access  Private
 */
router.post(
  '/contribution',
  recordContributionValidation,
  validate,
  settlementController.recordContribution.bind(settlementController)
);

/**
 * @route   POST /api/settlements/refund
 * @desc    Record a refund from mess fund
 * @access  Private (Owner/Admin only)
 */
router.post(
  '/refund',
  recordRefundValidation,
  validate,
  settlementController.recordRefund.bind(settlementController)
);

/**
 * @route   GET /api/settlements/suggestions
 * @desc    Get settlement suggestions
 * @access  Private
 */
router.get(
  '/suggestions',
  getSettlementSuggestionsValidation,
  validate,
  settlementController.getSettlementSuggestions.bind(settlementController)
);

/**
 * @route   GET /api/settlements
 * @desc    Get settlements with pagination and filtering
 * @access  Private (role-based filtering)
 */
router.get(
  '/',
  getSettlementsValidation,
  validate,
  settlementController.getSettlements.bind(settlementController)
);

export default router;
