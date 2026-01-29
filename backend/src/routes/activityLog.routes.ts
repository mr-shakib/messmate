import { Router } from 'express';
import { query } from 'express-validator';
import activityLogController from '../controllers/activityLog.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All activity log routes require authentication
router.use(authenticate);

// Validation rules
const getActivityLogsValidation = [
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
  query('activityType')
    .optional()
    .isIn(['expense', 'settlement', 'member'])
    .withMessage('Invalid activity type'),
];

/**
 * @route   GET /api/activity-logs
 * @desc    Get activity logs with pagination and filtering
 * @access  Private (Owner: all logs, Admin: expense/settlement only)
 */
router.get(
  '/',
  getActivityLogsValidation,
  validate,
  activityLogController.getActivityLogs.bind(activityLogController)
);

export default router;
