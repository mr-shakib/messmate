import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import { generateCsrfToken, verifyCsrfToken } from './middleware/csrf.middleware';
import authRoutes from './routes/auth.routes';
import messRoutes from './routes/mess.routes';
import expenseRoutes from './routes/expense.routes';
import settlementRoutes from './routes/settlement.routes';
import balanceRoutes from './routes/balance.routes';
import dashboardRoutes from './routes/dashboard.routes';
import activityLogRoutes from './routes/activityLog.routes';
import collectionRoutes from './routes/collection.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware - Helmet with enhanced configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }));
  
  // CORS configuration with whitelisted origins
  const allowedOrigins = env.corsOrigin.split(',').map(origin => origin.trim());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 600, // 10 minutes
  }));

  // Cookie parser for CSRF tokens
  app.use(cookieParser());

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Generate CSRF token for all requests
  app.use(generateCsrfToken);

  // Health check endpoint (no CSRF required)
  app.get('/health', async (_req: Request, res: Response) => {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.nodeEnv,
      database: {
        status: 'unknown',
        connected: false,
      },
    };

    try {
      // Check database connectivity
      const mongoose = require('mongoose');
      const dbState = mongoose.connection.readyState;
      
      // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (dbState === 1) {
        healthCheck.database.status = 'connected';
        healthCheck.database.connected = true;
        
        // Perform a simple ping to verify database is responsive
        await mongoose.connection.db.admin().ping();
      } else {
        healthCheck.status = 'degraded';
        healthCheck.database.status = dbState === 2 ? 'connecting' : 'disconnected';
        healthCheck.database.connected = false;
      }
    } catch (error) {
      healthCheck.status = 'error';
      healthCheck.database.status = 'error';
      healthCheck.database.connected = false;
      logger.error('Health check database error:', error);
    }

    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  });

  // CSRF endpoint to get token
  app.get('/api/csrf-token', (_req: Request, res: Response) => {
    res.status(200).json({
      csrfToken: res.locals.csrfToken,
    });
  });

  // Detailed health check endpoint for monitoring
  app.get('/health/detailed', async (_req: Request, res: Response) => {
    const mongoose = require('mongoose');
    const detailedHealth = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        memory: {
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        },
      },
      database: {
        status: 'unknown',
        connected: false,
        host: '',
        name: '',
      },
    };

    try {
      const dbState = mongoose.connection.readyState;
      
      if (dbState === 1) {
        detailedHealth.database.status = 'connected';
        detailedHealth.database.connected = true;
        detailedHealth.database.host = mongoose.connection.host;
        detailedHealth.database.name = mongoose.connection.name;
        
        // Perform a simple ping
        await mongoose.connection.db.admin().ping();
      } else {
        detailedHealth.status = 'degraded';
        detailedHealth.database.status = dbState === 2 ? 'connecting' : 'disconnected';
        detailedHealth.database.connected = false;
      }
    } catch (error) {
      detailedHealth.status = 'error';
      detailedHealth.database.status = 'error';
      detailedHealth.database.connected = false;
      logger.error('Detailed health check error:', error);
    }

    const statusCode = detailedHealth.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  });

  // Apply CSRF protection to all state-changing API routes (skip in test environment and auth routes)
  if (env.nodeEnv !== 'test') {
    app.use('/api', (req, res, next) => {
      // Skip CSRF for authentication routes (register, login, refresh)
      if (req.path.startsWith('/auth/register') || 
          req.path.startsWith('/auth/login') || 
          req.path.startsWith('/auth/refresh')) {
        return next();
      }
      return verifyCsrfToken(req, res, next);
    });
  }

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/messes', messRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/settlements', settlementRoutes);
  app.use('/api/balances', balanceRoutes);
  app.use('/api/collections', collectionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/activity-logs', activityLogRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};
