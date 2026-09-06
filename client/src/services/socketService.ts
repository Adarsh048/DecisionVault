import { io, Socket } from 'socket.io-client';
import { useNotificationStore, WorkspaceNotification } from '@/store/notificationStore';
import { useDecisionStore, DecisionRecord } from '@/store/decisionStore';

class SocketService {
  private socket: Socket | null = null;
  private isInitialized = false;

  public init(workspaceId: string = 'default-org'): Socket | null {
    if (this.isInitialized && this.socket?.connected) {
      return this.socket;
    }

    // Determine target URL for Socket.IO
    const socketUrl =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : window.location.origin;

    try {
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log(`[SocketService] Connected with socket ID: ${this.socket?.id}`);
        this.socket?.emit('join_workspace', workspaceId);
      });

      this.socket.on('notification:new_decision', (notification: WorkspaceNotification) => {
        console.log('[SocketService] Received new decision notification:', notification);
        useNotificationStore.getState().addNotification(notification);
      });

      this.socket.on('decision:sync_record', (remoteRecord: DecisionRecord) => {
        console.log('[SocketService] Received remote decision record sync:', remoteRecord);
        if (remoteRecord && remoteRecord.id) {
          useDecisionStore.getState().receiveRemoteDecision(remoteRecord);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.warn('[SocketService] Connection warning:', error.message);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
      });

      this.isInitialized = true;
      return this.socket;
    } catch (err) {
      console.error('[SocketService] Failed to initialize Socket.IO:', err);
      return null;
    }
  }

  /**
   * Broadcast a newly created decision to all other workspace members
   */
  public broadcastNewDecision(record: DecisionRecord): void {
    if (!this.socket || !this.socket.connected) {
      // Re-attempt connect if not connected
      this.init();
    }

    if (this.socket && this.socket.connected) {
      console.log(`[SocketService] 📢 Emitting decision:created for ADR-${record.number}`);
      this.socket.emit('decision:created', record);
    } else {
      console.warn('[SocketService] Socket not currently connected, fallback local simulation');
      // If socket is momentarily disconnected, we still notify locally
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
    }
  }
}

export const socketService = new SocketService();
