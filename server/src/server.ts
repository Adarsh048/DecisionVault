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

  // ─── Socket.IO Real-Time Notification & Sync Server ─────────────────────
  const io = new SocketServer(httpServer, {
    cors: {
      origin: [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/,
        /^https?:\/\/.*(\.loca\.lt|\.ngrok-free\.app|\.trycloudflare\.com)$/,
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // In-memory buffer of recent workspace notifications for connected and reconnecting clients
  const recentNotifications: any[] = [];

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join workspace/organization room
    socket.on('join_workspace', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
      logger.debug(`Socket ${socket.id} joined workspace:${workspaceId}`);
      // Send recent notifications on join
      if (recentNotifications.length > 0) {
        socket.emit('notifications:recent', recentNotifications);
      }
    });

    socket.on('request_recent_notifications', () => {
      socket.emit('notifications:recent', recentNotifications);
    });

    // Handle new decision broadcast from a creator
    socket.on('decision:created', (payload) => {
      logger.info(`📢 Broadcasting new decision: ADR-${payload?.number} "${payload?.title}" by ${payload?.author?.name}`);
      
      const isOwner = Boolean(
        payload?.author?.role?.toLowerCase().includes('owner') ||
        payload?.author?.email?.toLowerCase().includes('admin@') ||
        payload?.author?.email?.toLowerCase().includes('sarah@')
      );

      const notificationData = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'decision_created',
        title: isOwner ? '👑 Owner Proposed New Decision' : 'New Decision Proposed',
        message: `${payload?.author?.name || 'A team member'} proposed ADR-${String(payload?.number || 1).padStart(3, '0')}: "${payload?.title}"`,
        decisionId: payload?.id,
        decisionNumber: payload?.number,
        decisionTitle: payload?.title,
        context: payload?.context,
        decisionExcerpt: payload?.decision,
        isOwnerProposal: isOwner,
        author: payload?.author,
        team: payload?.team,
        status: payload?.status || 'proposed',
        createdAt: new Date().toISOString(),
        read: false,
        acknowledgedDialog: false,
      };

      // Add to recent buffer
      recentNotifications.unshift(notificationData);
      if (recentNotifications.length > 50) recentNotifications.pop();

      // Broadcast notification and full decision payload to all OTHER clients
      socket.broadcast.emit('notification:new_decision', notificationData);
      socket.broadcast.emit('decision:sync_record', payload);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  // ─── Start HTTP Server ────────────────────────────────────────────────────
  httpServer.listen(env.PORT, '0.0.0.0', () => {
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
