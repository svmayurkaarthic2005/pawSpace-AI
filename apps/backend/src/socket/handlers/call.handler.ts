import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../socket.types';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const registerCallHandlers = (io: IO, socket: AuthenticatedSocket): void => {
  const callerId = socket.user.userId;

  // ── call:invite ─────────────────────────────────────────────────────────────
  // Caller invites a specific user to a video call
  socket.on('call:invite', (payload) => {
    const { toUserId, channelName, callerName, callerAvatar } = payload;

    console.log(`[call] ${callerId} inviting ${toUserId} to channel ${channelName}`);

    // Forward the invitation to the target user's personal room
    io.to(`user:${toUserId}`).emit('call:invite', {
      fromUserId: callerId,
      toUserId,
      channelName,
      callerName,
      callerAvatar,
    });
  });

  // ── call:accept ─────────────────────────────────────────────────────────────
  // Callee accepted — notify the caller to proceed
  socket.on('call:accept', (payload) => {
    const { channelName, toUserId } = payload;

    console.log(`[call] ${callerId} accepted call on channel ${channelName}`);

    io.to(`user:${toUserId}`).emit('call:accepted', {
      channelName,
      byUserId: callerId,
    });
  });

  // ── call:reject ─────────────────────────────────────────────────────────────
  // Callee rejected — notify the caller
  socket.on('call:reject', (payload) => {
    const { channelName, toUserId, reason } = payload;

    console.log(`[call] ${callerId} rejected call on channel ${channelName}`);

    io.to(`user:${toUserId}`).emit('call:rejected', {
      channelName,
      byUserId: callerId,
      reason,
    });
  });

  // ── call:end ────────────────────────────────────────────────────────────────
  // Either party ended the call — notify the other side
  socket.on('call:end', (payload) => {
    const { channelName, toUserId } = payload;

    console.log(`[call] ${callerId} ended call on channel ${channelName}`);

    io.to(`user:${toUserId}`).emit('call:ended', {
      channelName,
      byUserId: callerId,
    });
  });
};
