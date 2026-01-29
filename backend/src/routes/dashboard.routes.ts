import { Router } from 'express';
import { query } from 'express-validator';
import dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Validation rules
const getDashboardValidation = [
  query('messId')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
];

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard data for a mess
 * @access  Private
 */
router.get(
  '/',
  getDashboardValidation,
  validate,
  dashboardController.getDashboard.bind(dashboardController)
);

export default router;
