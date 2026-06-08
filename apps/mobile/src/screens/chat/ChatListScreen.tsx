import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import { socketService } from '../../services/socket.service';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useAsyncStorageState } from '../../hooks/useAsyncStorageState';
import { ChatListHeader } from '../../components/chat/ChatListHeader';
import { AIBanner } from '../../components/chat/AIBanner';
import { OnlineStrip } from '../../components/chat/OnlineStrip';
import { SwipeableChatRow } from '../../components/chat/SwipeableChatRow';
import { EmptyChatState } from '../../components/chat/EmptyChatState';

export const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { currentActiveChatId } = useChatStore();

  // Helper to get user ID (backend uses _id, frontend type uses id)
  const getUserId = () => (user as any)?._id || user?.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useAsyncStorageState('dismissed_ai_banner', false);

  // Fetch chats
  const { data: chatsData, isLoading, refetch } = useQuery({
    queryKey: ['chats'],
    queryFn: () => api.get('/chats').then((r: any) => r.data.data),
    staleTime: 30_000,
  });

  // Fetch online contacts
  const { data: onlineContacts } = useQuery({
    queryKey: ['online-contacts'],
    queryFn: () => api.get('/chats/online-contacts').then((r: any) => r.data.data),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const chats = chatsData ?? [];
  
  // Filter chats by search query
  const filteredChats = searchQuery
    ? chats.filter((c: any) =>
        c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage?.content?.text?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : chats;

  // Socket listeners for real-time updates
  useEffect(() => {
    const handleChatListUpdate = ({ chatId, lastMessage, unreadCount }: any) => {
      queryClient.setQueryData(['chats'], (old: any) => {
        if (!old) return old;
        
        const updated = old.map((c: any) =>
          c._id === chatId
            ? {
                ...c,
                lastMessage,
                unreadCount: unreadCount ?? c.unreadCount,
                lastMessageAt: new Date().toISOString(),
              }
            : c,
        );

        // Move updated chat to top
        const idx = updated.findIndex((c: any) => c._id === chatId);
        if (idx > 0) {
          const [chat] = updated.splice(idx, 1);
          updated.unshift(chat);
        }

        return updated;
      });
    };

    const handleNewMessage = ({ chatId }: any) => {
      // Only update if user is NOT currently viewing this chat
      if (currentActiveChatId !== chatId) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    };

    socketService.on('chat:list_update', handleChatListUpdate);
    socketService.on('chat:message', handleNewMessage);

    return () => {
      socketService.off('chat:list_update', handleChatListUpdate);
      socketService.off('chat:message', handleNewMessage);
    };
  }, [queryClient, currentActiveChatId]);

  const openChat = useCallback(
    (chat: any) => {
      (navigation as any).navigate('ChatRoom', {
        chatId: chat._id,
        otherUser: {
          _id: chat.otherUser._id,
          username: chat.otherUser.username,
          name: chat.otherUser.name || chat.otherUser.username,
          avatar: chat.otherUser.avatar,
        },
      });
    },
    [navigation],
  );

  const handleMute = useCallback(
    async (chatId: string) => {
      try {
        await api.post(`/chats/${chatId}/mute`, { duration: 24 });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      } catch (error) {
        console.error('Failed to mute chat:', error);
      }
    },
    [queryClient],
  );

  const handleDelete = useCallback(
    async (chatId: string) => {
      try {
        await api.delete(`/chats/${chatId}`);
        queryClient.setQueryData(['chats'], (old: any) => old?.filter((c: any) => c._id !== chatId));
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    },
    [queryClient],
  );

  const renderItem = useCallback(
    ({ item }: any) => (
      <SwipeableChatRow
        chat={item}
        currentUserId={getUserId()}
        onPress={() => openChat(item)}
        onMute={() => handleMute(item._id)}
        onDelete={() => handleDelete(item._id)}
      />
    ),
    [user, openChat, handleMute, handleDelete],
  );

  const renderHeader = useCallback(
    () => (
      <>
        {!dismissedBanner && chats.length === 0 && (
          <AIBanner onDismiss={() => setDismissedBanner(true)} />
        )}
        <OnlineStrip contacts={onlineContacts ?? []} />
      </>
    ),
    [dismissedBanner, chats.length, onlineContacts, setDismissedBanner],
  );

  const renderSeparator = useCallback(
    () => (
      <View
        style={{
          height: 0.5,
          backgroundColor: 'rgba(255,255,255,0.05)',
          marginLeft: 80,
        }}
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ChatListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchFocus={() => setIsSearchFocused(true)}
        onSearchBlur={() => setIsSearchFocused(false)}
        onCompose={() => (navigation as any).navigate('NewChat')}
      />

      {!isLoading && chats.length === 0 && !searchQuery ? (
        <EmptyChatState onStart={() => (navigation as any).navigate('NewChat')} />
      ) : (
        <FlashList
          data={filteredChats}
          keyExtractor={(item: any) => item._id}
          renderItem={renderItem}
          estimatedItemSize={72}
          ListHeaderComponent={renderHeader}
          ItemSeparatorComponent={renderSeparator}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#7C3AED"
              colors={['#7C3AED']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate('NewChat')}
        activeOpacity={0.8}
      >
        <Icon name="plus" color="#fff" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default ChatListScreen;
