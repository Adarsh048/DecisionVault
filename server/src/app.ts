import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';
import apiRouter from './routes/index';

export function createApp(): express.Application {
  const app = express();

  // ─── Security Headers ─────────────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        origin === env.CLIENT_URL ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
        /^https?:\/\/.*(\.loca\.lt|\.ngrok-free\.app|\.trycloudflare\.com)$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`Blocked by CORS: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // ─── Body Parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // ─── Request Logging ──────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
  }

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  app.use('/api', generalLimiter);

  // ─── API Routes ───────────────────────────────────────────────────────────
  app.use('/api/v1', apiRouter);

  // ─── 404 Handler ─────────────────────────────────────────────────────────
  app.use(notFound);

  // ─── Global Error Handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
