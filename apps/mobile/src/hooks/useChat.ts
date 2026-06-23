import { useEffect, useRef, useCallback } from 'react';
import { socketService, SerializedMessage, TypingPayload, ReadReceiptPayload } from '../services/socket.service';
import { useChatStore } from '../store/chatStore';

interface UseChatOptions {
  chatId: string;
  currentUserId: string;
}

export const useChat = ({ chatId, currentUserId }: UseChatOptions) => {
  const {
    addMessage,
    updateMessage,
    deleteMessage,
    setTyping,
    clearTyping,
    markRead,
    setUserOnline,
    setUserOffline,
    updateChatLastMessage,
    incrementUnread,
    activeChat,
  } = useChatStore();

  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Join / leave chat room ─────────────────────────────────────────────────

  useEffect(() => {
    socketService.joinChat(chatId);
    return () => {
      socketService.leaveChat(chatId);
    };
  }, [chatId]);

  // ── Subscribe to socket events ────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (msg: SerializedMessage) => {
      if (msg.chatId !== chatId) return;

      // If this is the sender's own confirmed message AND it has a tempId,
      // skip it here — chat:message_sent already handles replacing the optimistic entry.
      if (msg.sender._id === currentUserId && msg.tempId) return;

      addMessage(chatId, msg);
      updateChatLastMessage(chatId, msg);

      // If this chat is not active, increment unread (only for others' messages)
      const activeChatId = useChatStore.getState().activeChat;
      if (activeChatId !== chatId && msg.sender._id !== currentUserId) {
        incrementUnread(chatId);
      }

      // Auto-mark as read if chat is active and message is from someone else
      if (activeChatId === chatId && msg.sender._id !== currentUserId) {
        socketService.markRead(chatId, msg._id);
        markRead(chatId);
      }
    };

    const handleMessageSent = (payload: { tempId: string; messageId: string; message: SerializedMessage }) => {
      if (payload.message.chatId !== chatId) return;
      
      // Replace optimistic message with confirmed one
      updateMessage(chatId, payload.tempId, {
        ...payload.message,
        _id: payload.messageId,
      });
    };

    const handleTyping = (payload: TypingPayload) => {
      if (payload.chatId !== chatId || payload.userId === currentUserId) return;
      setTyping(chatId, payload.userId);

      // Auto-clear typing after 4s (safety net)
      const key = `${chatId}:${payload.userId}`;
      clearTimeout(typingTimers.current[key]);
      typingTimers.current[key] = setTimeout(() => {
        clearTyping(chatId, payload.userId);
      }, 4000);
    };

    const handleTypingStop = (payload: TypingPayload) => {
      if (payload.chatId !== chatId || payload.userId === currentUserId) return;
      const key = `${chatId}:${payload.userId}`;
      clearTimeout(typingTimers.current[key]);
      clearTyping(chatId, payload.userId);
    };

    const handleReadReceipt = (payload: ReadReceiptPayload) => {
      if (payload.chatId !== chatId) return;
      updateMessage(chatId, payload.messageId, {
        readBy: [{ user: payload.userId, readAt: payload.readAt }],
      });
    };

    const handleMessageDeleted = (payload: { chatId: string; messageId: string }) => {
      if (payload.chatId !== chatId) return;
      deleteMessage(chatId, payload.messageId);
    };

    const handleUserOnline = (payload: { userId: string }) => {
      setUserOnline(payload.userId);
    };

    const handleUserOffline = (payload: { userId: string }) => {
      setUserOffline(payload.userId);
    };

    socketService.on('chat:message', handleMessage);
    socketService.on('chat:message_sent', handleMessageSent);
    socketService.on('chat:typing', handleTyping);
    socketService.on('chat:typing:stop', handleTypingStop);
    socketService.on('chat:read_receipt', handleReadReceipt);
    socketService.on('chat:message:deleted', handleMessageDeleted);
    socketService.on('user:online', handleUserOnline);
    socketService.on('user:offline', handleUserOffline);

    return () => {
      socketService.off('chat:message', handleMessage);
      socketService.off('chat:message_sent', handleMessageSent);
      socketService.off('chat:typing', handleTyping);
      socketService.off('chat:typing:stop', handleTypingStop);
      socketService.off('chat:read_receipt', handleReadReceipt);
      socketService.off('chat:message:deleted', handleMessageDeleted);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);

      // Clear all typing timers
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [chatId, currentUserId, addMessage, updateMessage, deleteMessage,
    setTyping, clearTyping, markRead, setUserOnline, setUserOffline,
    updateChatLastMessage, incrementUnread]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    (text: string, tempId?: string) => {
      socketService.sendMessage(chatId, { type: 'text', text }, tempId);
    },
    [chatId],
  );

  const sendImageMessage = useCallback(
    (mediaUrl: string, tempId?: string) => {
      socketService.sendMessage(chatId, { type: 'image', mediaUrl }, tempId);
    },
    [chatId],
  );

  const startTyping = useCallback(() => socketService.startTyping(chatId), [chatId]);
  const stopTyping = useCallback(() => socketService.stopTyping(chatId), [chatId]);

  const markAsRead = useCallback(
    (messageId: string) => {
      socketService.markRead(chatId, messageId);
      markRead(chatId);
    },
    [chatId, markRead],
  );

  return { sendMessage, sendImageMessage, startTyping, stopTyping, markAsRead };
};
