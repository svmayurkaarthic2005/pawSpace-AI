import { create } from 'zustand';
import { SerializedMessage } from '../services/socket.service';

export interface ChatParticipant {
  _id: string;
  username: string;
  name?: string;
  avatar?: string;
}

interface ChatState {
  currentActiveChatId: string | null;
  messages: Record<string, SerializedMessage[]>;
  typingUsers: Record<string, string[]>; // chatId -> userIds[]
  onlineUsers: Set<string>;
  activeChat: string | null;
  
  setCurrentActiveChatId: (chatId: string | null) => void;
  setActiveChat: (chatId: string | null) => void;
  setMessages: (chatId: string, messages: SerializedMessage[]) => void;
  mergeMessages: (chatId: string, messages: SerializedMessage[]) => void;
  addMessage: (chatId: string, message: SerializedMessage) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<SerializedMessage>) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setTyping: (chatId: string, userId: string) => void;
  clearTyping: (chatId: string, userId: string) => void;
  markRead: (chatId: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  updateChatLastMessage: (chatId: string, message: SerializedMessage) => void;
  incrementUnread: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentActiveChatId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  activeChat: null,
  
  setCurrentActiveChatId: (chatId) => set({ currentActiveChatId: chatId }),
  
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  
  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),
    
  mergeMessages: (chatId, newMessages) =>
    set((state) => {
      const existing = state.messages[chatId] || [];
      const msgMap = new Map<string, SerializedMessage>();

      // Index existing messages by _id
      existing.forEach(m => msgMap.set(m._id, m));

      // Build a set of all tempIds already tracked (optimistic messages)
      const trackedTempIds = new Set(
        existing.filter(m => m.tempId).map(m => m.tempId!)
      );

      // Merge server messages, skip any whose ID is already a known tempId
      // (prevents re-adding a message that was just confirmed optimistically)
      newMessages.forEach(m => {
        if (!msgMap.has(m._id) && !trackedTempIds.has(m._id)) {
          msgMap.set(m._id, m);
        }
      });

      // Sort descending (newest first)
      const merged = Array.from(msgMap.values()).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        messages: { ...state.messages, [chatId]: merged },
      };
    }),
  
  addMessage: (chatId, message) =>
    set((state) => {
      const existing = state.messages[chatId] || [];

      // Exact duplicate by real _id
      if (existing.some(m => m._id === message._id && !message.tempId)) {
        return state;
      }

      // Check if this incoming confirmed message matches an optimistic (tempId) message.
      // If so, REPLACE the optimistic entry rather than adding a duplicate.
      const optimisticIndex = existing.findIndex(
        m =>
          (message.tempId && m._id === message.tempId) || // optimistic _id === incoming tempId
          (m.tempId && m.tempId === message.tempId) ||    // same tempId
          (m.tempId && m.tempId === message._id)          // optimistic _id is the real _id (shouldn't happen but guard)
      );

      if (optimisticIndex !== -1) {
        // Replace optimistic entry with confirmed message
        const updated = [...existing];
        updated[optimisticIndex] = { ...message, tempId: undefined };
        return {
          messages: { ...state.messages, [chatId]: updated },
        };
      }

      return {
        messages: {
          ...state.messages,
          [chatId]: [...existing, message],
        },
      };
    }),
  
  updateMessage: (chatId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((msg) =>
          msg._id === messageId || msg.tempId === messageId ? { ...msg, ...updates } : msg
        ),
      },
    })),
  
  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter((msg) => msg._id !== messageId),
      },
    })),
  
  setTyping: (chatId, userId) =>
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      if (current.includes(userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: [...current, userId],
        },
      };
    }),
  
  clearTyping: (chatId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: (state.typingUsers[chatId] || []).filter((id) => id !== userId),
      },
    })),
  
  markRead: (chatId) =>
    set((state) => {
      // Mark all messages in this chat as read by adding current user to readBy
      const messages = state.messages[chatId] || [];
      // This is a simplified version - in reality you'd add the current user ID to readBy array
      return state;
    }),
  
  setUserOnline: (userId) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.add(userId);
      return { onlineUsers: newOnlineUsers };
    }),
  
  setUserOffline: (userId) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    }),
  
  updateChatLastMessage: (chatId, message) => {
    // This would typically update the chat list item
    // For now, it's a no-op as the chat list uses react-query
  },
  
  incrementUnread: (chatId) => {
    // This would typically increment unread count
    // For now, it's a no-op as the chat list uses react-query
  },
}));
