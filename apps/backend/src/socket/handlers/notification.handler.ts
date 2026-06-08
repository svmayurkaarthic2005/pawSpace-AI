import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
} from '../socket.types';
import { notificationService } from '../../services/notification.service';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

export const registerNotificationHandlers = (
  _io: IoServer,
  socket: AuthenticatedSocket,
): void => {
  const userId = socket.user.userId;

  // ── notification:read ──────────────────────────────────────────────────────
  // Mark a single notification as read

  socket.on('notification:read', async (notificationId: string) => {
    try {
      await notificationService.markOneRead(userId, notificationId);
      socket.emit('notification:read', notificationId);
    } catch (err) {
      console.error('[notification:read]', err);
    }
  });

  // ── On connection: send current unread count ───────────────────────────────

  (async () => {
    try {
      const count = await notificationService.getUnreadCount(userId);
      socket.emit('notification:count', { count });
    } catch (err) {
      console.error('[notification:count on connect]', err);
    }
  })();
};
