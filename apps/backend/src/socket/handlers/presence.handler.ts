import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  PresenceStatus,
} from '../socket.types';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

export const registerPresenceHandlers = (
  _io: IoServer,
  socket: AuthenticatedSocket,
): void => {

  // ── presence:check ─────────────────────────────────────────────────────────
  // Client sends a list of userIds and gets back their online status.

  socket.on(
    'presence:check',
    async (
      userIds: string[],
      callback: (statuses: PresenceStatus[]) => void,
    ) => {
      try {
        if (!Array.isArray(userIds) || userIds.length === 0) {
          callback([]);
          return;
        }

        // Cap at 50 to prevent abuse
        const limited = userIds.slice(0, 50);

        const pipeline = (await import('../../config/redis')).redis.pipeline();
        for (const uid of limited) {
          pipeline.exists(`presence:${uid}`);
        }
        const results = await pipeline.exec();

        const statuses: PresenceStatus[] = limited.map((uid, i) => {
          const exists = (results?.[i]?.[1] as number) === 1;
          return { userId: uid, isOnline: exists };
        });

        callback(statuses);
      } catch (err) {
        console.error('[presence:check]', err);
        callback([]);
      }
    },
  );
};

// ─── Broadcast presence to followers ─────────────────────────────────────────

export const broadcastOnline = async (
  io: IoServer,
  userId: string,
  socketId: string,
): Promise<void> => {
  try {
    // Get follower IDs from Redis set
    const followerIds = await (await import('../../config/redis')).redis.smembers(
      `followers:${userId}`,
    );

    if (followerIds.length === 0) return;

    // Emit to each follower's personal room
    for (const followerId of followerIds) {
      io.to(`user:${followerId}`).emit('user:online', { userId, socketId });
    }
  } catch (err) {
    console.error('[broadcastOnline]', err);
  }
};

export const broadcastOffline = async (
  io: IoServer,
  userId: string,
): Promise<void> => {
  try {
    const followerIds = await (await import('../../config/redis')).redis.smembers(
      `followers:${userId}`,
    );

    if (followerIds.length === 0) return;

    const lastSeen = new Date().toISOString();
    for (const followerId of followerIds) {
      io.to(`user:${followerId}`).emit('user:offline', { userId, lastSeen });
    }
  } catch (err) {
    console.error('[broadcastOffline]', err);
  }
};
