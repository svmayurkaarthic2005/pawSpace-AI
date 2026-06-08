import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { cacheService } from '../services/cache.service';
import { userRepository } from '../repositories/user.repository';
import { registerChatHandlers } from './handlers/chat.handler';
import { registerNotificationHandlers } from './handlers/notification.handler';
import { registerPresenceHandlers, broadcastOnline, broadcastOffline } from './handlers/presence.handler';
import { setupCommunityHandlers } from './handlers/community.handler';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './socket.types';

// ─── Create and configure Socket.IO server ───────────────────────────────────

export const createSocketServer = (
  httpServer: HttpServer,
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.NODE_ENV === 'production' ? [] : '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    },
  );

  // ── JWT Auth Middleware ────────────────────────────────────────────────────

  io.use((socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth as { token?: string }).token ??
        (socket.handshake.headers.authorization as string | undefined)?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        email: string;
      };

      // Attach user to socket
      (socket as AuthenticatedSocket).user = {
        userId: payload.userId,
        email: payload.email,
      };

      socket.data.userId = payload.userId;
      socket.data.email = payload.email;

      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────────

  io.on('connection', async (socket: Socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    const userId = authedSocket.user.userId;

    console.log(`🔌 Socket connected: ${socket.id} | user: ${userId}`);

    try {
      // 1. Mark user online in Redis
      await cacheService.setUserOnline(userId, socket.id);

      // 2. Join personal room for targeted events
      await socket.join(`user:${userId}`);

      // 3. Broadcast online status to followers
      await broadcastOnline(io, userId, socket.id);

      // 4. Update DB online status
      await userRepository.setOnlineStatus(userId, true);
    } catch (err) {
      console.error('[socket:connect] setup error:', err);
    }

    // ── Register domain handlers ─────────────────────────────────────────────

    registerChatHandlers(io, authedSocket);
    registerNotificationHandlers(io, authedSocket);
    registerPresenceHandlers(io, authedSocket);
    setupCommunityHandlers(authedSocket);

    // ── Disconnect ───────────────────────────────────────────────────────────

    socket.on('disconnect', async (reason: string) => {
      console.log(`🔌 Socket disconnected: ${socket.id} | user: ${userId} | reason: ${reason}`);

      try {
        // Check if user has other active connections before marking offline
        const sockets = await io.in(`user:${userId}`).fetchSockets();
        const otherConnections = sockets.filter((s) => s.id !== socket.id);

        if (otherConnections.length === 0) {
          // No other connections — truly offline
          await cacheService.setUserOffline(userId);
          await broadcastOffline(io, userId);
          await userRepository.setOnlineStatus(userId, false);
        }
      } catch (err) {
        console.error('[socket:disconnect] cleanup error:', err);
      }
    });

    // ── Error handler ────────────────────────────────────────────────────────

    socket.on('error', (err: Error) => {
      console.error(`[socket:error] ${socket.id}:`, err.message);
    });
  });

  return io;
};

// ─── Export IO instance getter ────────────────────────────────────────────────

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

export const setIO = (io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void => {
  ioInstance = io;
};

export const getIO = (): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized');
  }
  return ioInstance;
};
