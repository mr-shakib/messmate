import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';
import mongoose from 'mongoose';
import { Server } from 'http';

let isShuttingDown = false;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Track active connections for graceful shutdown
    const connections = new Set<any>();
    
    // Start server
    const server: Server = app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
    });

    // Track connections
    server.on('connection', (connection) => {
      connections.add(connection);
      connection.on('close', () => {
        connections.delete(connection);
      });
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) {
        logger.warn('Shutdown already in progress, ignoring signal');
        return;
      }
      
      isShuttingDown = true;
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error('Error closing HTTP server:', err);
        } else {
          logger.info('HTTP server closed - no longer accepting new connections');
        }
        
        try {
          // Close all active connections gracefully
          logger.info(`Closing ${connections.size} active connections...`);
          connections.forEach((connection) => {
            connection.end();
          });
          
          // Wait a bit for connections to close
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Force close remaining connections
          connections.forEach((connection) => {
            connection.destroy();
          });
          
          // Close database connection
          await mongoose.connection.close(false);
          logger.info('MongoDB connection closed');
          
          logger.info('Graceful shutdown completed successfully');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after timeout if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Graceful shutdown timeout exceeded, forcing shutdown');
        
        // Force close all connections
        connections.forEach((connection) => {
          connection.destroy();
        });
        
        process.exit(1);
      }, 30000); // 30 seconds timeout
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
