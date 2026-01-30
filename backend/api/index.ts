import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/database';
import { logger } from '../src/config/logger';

// Cache the database connection
let isConnected = false;

const handler = async (req: any, res: any) => {
  try {
    // Connect to database if not already connected
    if (!isConnected) {
      await connectDatabase();
      isConnected = true;
      logger.info('Database connected for serverless function');
    }

    // Create Express app
    const app = createApp();

    // Handle the request
    return app(req, res);
  } catch (error) {
    logger.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
};

export default handler;
