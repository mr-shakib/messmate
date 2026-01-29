import { Router } from 'express';
import { body, param } from 'express-validator';
import messController from '../controllers/mess.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All mess routes require authentication
router.use(authenticate);

// Validation rules
const createMessValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Mess name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Mess name must be between 2 and 100 characters'),
  body('memberLimit')
    .notEmpty()
    .withMessage('Member limit is required')
    .isInt({ min: 6, max: 20 })
    .withMessage('Member limit must be between 6 and 20'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

const updateMessValidation = [
  param('id')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Mess name must be between 2 and 100 characters'),
  body('memberLimit')
    .optional()
    .isInt({ min: 6, max: 20 })
    .withMessage('Member limit must be between 6 and 20'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

const messIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
];

const generateInviteLinkValidation = [
  param('id')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
  body('expiresInHours')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Expiration must be between 1 and 168 hours (7 days)'),
];

const joinByCodeValidation = [
  body('inviteCode')
    .trim()
    .notEmpty()
    .withMessage('Invite code is required')
    .isLength({ min: 8, max: 8 })
    .withMessage('Invite code must be 8 characters')
    .isAlphanumeric()
    .withMessage('Invite code must be alphanumeric'),
];

const joinByLinkValidation = [
  body('token')
    .notEmpty()
    .withMessage('Invite link token is required')
    .isString()
    .withMessage('Token must be a string'),
];

const removeMemberValidation = [
  param('id')
    .notEmpty()
    .withMessage('Mess ID is required')
    .isMongoId()
    .withMessage('Invalid mess ID format'),
  param('memberId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid member ID format'),
];

/**
 * @route   POST /api/messes
 * @desc    Create a new mess
 * @access  Private
 */
router.post(
  '/',
  createMessValidation,
  validate,
  messController.createMess.bind(messController)
);

/**
 * @route   GET /api/messes
 * @desc    Get all messes for the authenticated user
 * @access  Private
 */
router.get(
  '/',
  messController.getUserMesses.bind(messController)
);

/**
 * @route   POST /api/messes/join/code
 * @desc    Join a mess using invite code
 * @access  Private
 */
router.post(
  '/join/code',
  joinByCodeValidation,
  validate,
  messController.joinByCode.bind(messController)
);

/**
 * @route   POST /api/messes/join/link
 * @desc    Join a mess using invite link token
 * @access  Private
 */
router.post(
  '/join/link',
  joinByLinkValidation,
  validate,
  messController.joinByLink.bind(messController)
);

/**
 * @route   GET /api/messes/:id
 * @desc    Get mess details
 * @access  Private
 */
router.get(
  '/:id',
  messIdValidation,
  validate,
  messController.getMess.bind(messController)
);

/**
 * @route   PUT /api/messes/:id
 * @desc    Update mess details
 * @access  Private (Owner only)
 */
router.put(
  '/:id',
  updateMessValidation,
  validate,
  messController.updateMess.bind(messController)
);

/**
 * @route   POST /api/messes/:id/invite
 * @desc    Generate invite link for a mess
 * @access  Private (Owner only)
 */
router.post(
  '/:id/invite',
  generateInviteLinkValidation,
  validate,
  messController.generateInviteLink.bind(messController)
);

/**
 * @route   DELETE /api/messes/:id/members/:memberId
 * @desc    Remove a member from a mess
 * @access  Private (Owner only)
 */
router.delete(
  '/:id/members/:memberId',
  removeMemberValidation,
  validate,
  messController.removeMember.bind(messController)
);

export default router;
