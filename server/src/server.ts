import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

// Bootstrap DecisionVault server instance
async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);

  // ─── Socket.IO (placeholder — full implementation in Phase 9) ─────────────
  const io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  // ─── Start HTTP Server ────────────────────────────────────────────────────
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀  DecisionVault server running on port ${env.PORT}`);
    logger.info(`📦  Environment: ${env.NODE_ENV}`);
    logger.info(`🌐  Client URL: ${env.CLIENT_URL}`);
    logger.info(`🏥  Health check: http://localhost:${env.PORT}/api/v1/health`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
    shutdown('UnhandledRejection');
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
