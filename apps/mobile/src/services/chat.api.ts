import api from './api';
import { ChatItem } from '../types';
import { SerializedMessage } from './socket.service';

export const chatApi = {
  async getUserChats(): Promise<ChatItem[]> {
    const { data } = await api.get<{ data: ChatItem[] }>('/chats');
    return data.data;
  },

  async getOrCreateChat(userId: string): Promise<ChatItem> {
    const { data } = await api.post<{ data: ChatItem }>('/chats', { userId });
    return data.data;
  },

  async getMessages(
    chatId: string,
    cursor?: string,
    limit = 30,
  ): Promise<{ items: SerializedMessage[]; nextCursor: string | null; hasMore: boolean }> {
    const params: Record<string, string> = { limit: String(limit) };
    if (cursor) params.cursor = cursor;
    const { data } = await api.get(`/chats/${chatId}/messages`, { params });
    return data.data;
  },

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await api.delete(`/chats/${chatId}/messages/${messageId}`);
  },
};
