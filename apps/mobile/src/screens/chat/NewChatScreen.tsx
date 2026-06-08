import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../services/api';

export const NewChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'search', searchQuery],
    queryFn: () =>
      searchQuery.trim()
        ? api.get(`/users/search?q=${searchQuery}`).then((r: any) => r.data.data)
        : Promise.resolve([]),
    enabled: searchQuery.trim().length > 0,
  });

  const handleUserSelect = async (user: any) => {
    try {
      // Create or get chat with this user
      const response = await api.post('/chats', { userId: user._id });
      const chat = response.data.data;
      
      (navigation as any).navigate('ChatRoom', {
        chatId: chat._id,
        otherUser: {
          _id: user._id,
          username: user.username,
          name: user.name || user.username,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const renderUser = ({ item }: any) => (
    <TouchableOpacity style={styles.userRow} onPress={() => handleUserSelect(item)}>
      <FastImage source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={styles.name}>{item.name || item.username}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <Icon name="message-circle" color="rgba(255,255,255,0.3)" size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>New Message</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" color="rgba(255,255,255,0.3)" size={18} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search users..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.searchInput}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="x" color="rgba(255,255,255,0.4)" size={18} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#7C3AED" />
        </View>
      )}

      {!isLoading && searchQuery.trim() && users?.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      )}

      {!isLoading && users && users.length > 0 && (
        <FlashList
          data={users}
          keyExtractor={(item: any) => item._id}
          renderItem={renderUser}
          estimatedItemSize={70}
        />
      )}

      {!searchQuery.trim() && (
        <View style={styles.emptyContainer}>
          <Icon name="search" color="rgba(255,255,255,0.1)" size={48} />
          <Text style={styles.emptyText}>Search for users to start chatting</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: 44,
    padding: 0,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
  },
});
