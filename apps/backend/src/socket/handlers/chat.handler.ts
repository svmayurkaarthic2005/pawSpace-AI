import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  SendMessagePayload,
  ReadPayload,
  SerializedMessage,
} from '../socket.types';
import { chatService } from '../../services/chat.service';
import { Chat } from '../../models/chat.model';
import { IMessage } from '../../models/message.model';
import { cacheService } from '../../services/cache.service';

type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Active typing timers: key = `${chatId}:${userId}`
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Serialize message for wire ───────────────────────────────────────────────

const serializeMessage = (msg: IMessage, tempId?: string): SerializedMessage => {
  const sender = msg.sender as unknown as {
    _id: { toString(): string };
    username: string;
    name: string;
    avatar?: string;
  };

  return {
    _id: msg._id.toString(),
    chatId: msg.chat.toString(),
    sender: {
      _id: sender._id.toString(),
      username: sender.username,
      name: sender.name,
      avatar: sender.avatar,
    },
    content: {
      type: msg.content.type,
      text: msg.content.text,
      mediaUrl: msg.content.mediaUrl,
    },
    readBy: msg.readBy.map((r) => ({
      user: r.user.toString(),
      readAt: r.readAt.toISOString(),
    })),
    isDeleted: msg.isDeleted,
    createdAt: msg.createdAt.toISOString(),
    ...(tempId && { tempId }),
  };
};

// ─── Register chat handlers on a socket ──────────────────────────────────────

export const registerChatHandlers = (
  io: IoServer,
  socket: AuthenticatedSocket,
): void => {
  const userId = socket.user.userId;

  // ── chat:join ──────────────────────────────────────────────────────────────

  socket.on('chat:join', async (chatId: string) => {
    try {
      const isParticipant = await chatService.verifyParticipant(chatId, userId);
      if (!isParticipant) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Not a participant in this chat' });
        return;
      }
      await socket.join(`chat:${chatId}`);
    } catch (err) {
      console.error('[chat:join]', err);
      socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to join chat' });
    }
  });

  // ── chat:leave ─────────────────────────────────────────────────────────────

  socket.on('chat:leave', (chatId: string) => {
    void socket.leave(`chat:${chatId}`);
  });

  // ── chat:send ──────────────────────────────────────────────────────────────

  socket.on('chat:send', async (payload: SendMessagePayload) => {
    try {
      const { chatId, content, tempId } = payload;

      // Validate content
      if (!content.type) {
        socket.emit('error', { code: 'VALIDATION_ERROR', message: 'Content type is required' });
        return;
      }
      if (content.type === 'text' && !content.text?.trim()) {
        socket.emit('error', { code: 'VALIDATION_ERROR', message: 'Message text cannot be empty' });
        return;
      }

      const message = await chatService.sendMessage(chatId, userId, content);
      const serialized = serializeMessage(message, tempId);

      // Emit to all participants in the room (including sender)
      io.to(`chat:${chatId}`).emit('chat:message', serialized);

      // Emit chat:message_sent to sender for optimistic update confirmation
      if (tempId) {
        socket.emit('chat:message_sent', {
          tempId,
          messageId: message._id.toString(),
          message: serialized,
        });
      }

      // Get chat details and emit list update to each participant
      const chat = await Chat.findById(chatId)
        .populate('lastMessage')
        .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'username name avatar' } })
        .exec();

      if (chat) {
        for (const participantId of chat.participants) {
          const pId = participantId.toString();
          const unreadCount = pId === userId ? 0 : (chat.unreadCounts.get(pId) ?? 0);

          io.to(`user:${pId}`).emit('chat:list_update', {
            chatId,
            lastMessage: chat.lastMessage ? serializeMessage(chat.lastMessage as any) : null,
            unreadCount,
          });
        }

        // Push notification to offline recipient
        const recipientId = chat.participants
          .find((p) => p.toString() !== userId)
          ?.toString();

        if (recipientId) {
          const isOnline = await cacheService.isUserOnline(recipientId);
          if (!isOnline) {
            await cacheService.cacheNotification(recipientId, {
              id: message._id.toString(),
              type: 'chat',
              message: content.text?.slice(0, 100) ?? 'Sent you a message',
              senderId: userId,
              entityId: chatId,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
            
            // Push Notification
            try {
              const { fcmService } = await import('../../services/fcm.service');
              fcmService.sendToUser(recipientId, {
                type: 'new_message',
                chatId,
                userId,
                senderName: (socket.user as any).username ?? socket.user.email?.split('@')[0] ?? 'Someone',
                messagePreview: content.text?.slice(0, 50) ?? (content.type === 'image' ? 'Sent an image' : 'Sent a message'),
              });
            } catch (err) {
              console.error('[chat:send] FCM error:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('[chat:send]', err);
      socket.emit('error', { code: 'SERVER_ERROR', message: 'Failed to send message' });
    }
  });

  // ── chat:typing:start ──────────────────────────────────────────────────────

  socket.on('chat:typing:start', (chatId: string) => {
    const timerKey = `${chatId}:${userId}`;

    // Clear any existing timer
    const existing = typingTimers.get(timerKey);
    if (existing) clearTimeout(existing);

    // Broadcast typing to room (exclude sender)
    socket.to(`chat:${chatId}`).emit('chat:typing', {
      chatId,
      userId,
      username: socket.user.email.split('@')[0], // fallback; real username from DB
    });

    // Auto-clear after 3 seconds
    const timer = setTimeout(() => {
      socket.to(`chat:${chatId}`).emit('chat:typing:stop', {
        chatId,
        userId,
        username: socket.user.email.split('@')[0],
      });
      typingTimers.delete(timerKey);
    }, 3000);

    typingTimers.set(timerKey, timer);
  });

  // ── chat:typing:stop ───────────────────────────────────────────────────────

  socket.on('chat:typing:stop', (chatId: string) => {
    const timerKey = `${chatId}:${userId}`;
    const existing = typingTimers.get(timerKey);
    if (existing) {
      clearTimeout(existing);
      typingTimers.delete(timerKey);
    }

    socket.to(`chat:${chatId}`).emit('chat:typing:stop', {
      chatId,
      userId,
      username: socket.user.email.split('@')[0],
    });
  });

  // ── chat:read ──────────────────────────────────────────────────────────────

  socket.on('chat:read', async (payload: ReadPayload) => {
    try {
      const { chatId, messageId } = payload;

      const isParticipant = await chatService.verifyParticipant(chatId, userId);
      if (!isParticipant) return;

      await chatService.markChatAsRead(chatId, userId);

      // Notify other participants of the read receipt
      socket.to(`chat:${chatId}`).emit('chat:read_receipt', {
        chatId,
        messageId,
        userId,
        readAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[chat:read]', err);
    }
  });
};
