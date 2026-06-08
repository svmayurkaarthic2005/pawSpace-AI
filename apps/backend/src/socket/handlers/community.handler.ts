import { Socket } from 'socket.io';
import { CommunityMembership } from '../../models/communityMembership.model';

export const setupCommunityHandlers = (socket: Socket): void => {
  // Join community room
  socket.on('community:join', async (communityId: string) => {
    try {
      if (!socket.data.userId) {
        console.warn('[Socket] User not authenticated, cannot join community room');
        return;
      }

      // Verify user is a member
      const membership = await CommunityMembership.findOne({
        community: communityId,
        user: socket.data.userId,
      });

      if (!membership) {
        console.warn(
          `[Socket] User ${socket.data.userId} is not a member of community ${communityId}`,
        );
        return;
      }

      const roomName = `community:${communityId}`;
      socket.join(roomName);
      console.log(`[Socket] User ${socket.data.userId} joined community room: ${roomName}`);

      // Emit member joined event to the room
      socket.to(roomName).emit('community:member_joined', {
        user: socket.data.userId,
        communityId,
      });
    } catch (error) {
      console.error('[Socket] Error joining community room:', error);
    }
  });

  // Leave community room
  socket.on('community:leave', (communityId: string) => {
    try {
      const roomName = `community:${communityId}`;
      socket.leave(roomName);
      console.log(`[Socket] User ${socket.data.userId} left community room: ${roomName}`);
    } catch (error) {
      console.error('[Socket] Error leaving community room:', error);
    }
  });

  // Typing indicator for community posts
  socket.on('community:typing', ({ communityId, isTyping }) => {
    try {
      const roomName = `community:${communityId}`;
      socket.to(roomName).emit('community:user_typing', {
        userId: socket.data.userId,
        communityId,
        isTyping,
      });
    } catch (error) {
      console.error('[Socket] Error broadcasting typing status:', error);
    }
  });
};
