import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import 'express-async-errors';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { router } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { generalLimiter } from './middlewares/rateLimit.js';
import { openapiDoc } from './config/openapi.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(generalLimiter);

  app.get('/', (_req, res) => {
    res.json({
      name: 'Farmacia UNAS API',
      version: '0.2.0',
      docs: '/api/docs',
      health: '/api/health',
    });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
  app.use('/api', router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
