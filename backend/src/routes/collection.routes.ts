import express, { Request, Response } from 'express';
import moneyCollectionService from '../services/moneyCollection.service';
import { authenticate } from '../middleware/auth.middleware';
import { verifyCsrfToken } from '../middleware/csrf.middleware';

const router = express.Router();

/**
 * @route   POST /api/collections
 * @desc    Record a money collection
 * @access  Private (Member)
 */
router.post(
  '/',
  authenticate,
  verifyCsrfToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { messId, memberId, amount, date, description } = req.body;

      // Validate required fields
      if (!messId || !memberId || !amount) {
        res.status(400).json({
          success: false,
          message: 'Mess ID, member ID, and amount are required',
        });
        return;
      }

      const collection = await moneyCollectionService.recordCollection(
        req.user!.userId,
        {
          messId,
          memberId,
          amount,
          date: date ? new Date(date) : undefined,
          description,
        }
      );

      res.status(201).json({
        success: true,
        data: collection,
      });
    } catch (error) {
      console.error('Error recording collection:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to record collection',
      });
    }
  }
);

/**
 * @route   GET /api/collections
 * @desc    Get collections with filters
 * @access  Private (Member)
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { messId, memberId, startDate, endDate, page, limit, sortBy, sortOrder } =
        req.query;

      // Validate required fields
      if (!messId) {
        res.status(400).json({
          success: false,
          message: 'Mess ID is required',
        });
        return;
      }

      const collections = await moneyCollectionService.getCollections(
        messId as string,
        req.user!.userId,
        {
          memberId: memberId as string | undefined,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          sortBy: sortBy as 'date' | 'amount' | undefined,
          sortOrder: sortOrder as 'asc' | 'desc' | undefined,
        }
      );

      res.json({
        success: true,
        data: collections,
      });
    } catch (error) {
      console.error('Error getting collections:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get collections',
      });
    }
  }
);

/**
 * @route   GET /api/collections/total
 * @desc    Get total collected for a mess
 * @access  Private (Member)
 */
router.get(
  '/total',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { messId, startDate, endDate } = req.query;

      // Validate required fields
      if (!messId) {
        res.status(400).json({
          success: false,
          message: 'Mess ID is required',
        });
        return;
      }

      const total = await moneyCollectionService.getTotalCollected(
        messId as string,
        startDate && endDate
          ? {
              startDate: new Date(startDate as string),
              endDate: new Date(endDate as string),
            }
          : undefined
      );

      res.json({
        success: true,
        data: { total },
      });
    } catch (error) {
      console.error('Error getting total collected:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get total collected',
      });
    }
  }
);

/**
 * @route   DELETE /api/collections/:id
 * @desc    Delete a collection (Owner only)
 * @access  Private (Owner)
 */
router.delete(
  '/:id',
  authenticate,
  verifyCsrfToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await moneyCollectionService.deleteCollection(id, req.user!.userId);

      res.json({
        success: true,
        message: 'Collection deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting collection:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete collection',
      });
    }
  }
);

export default router;
