import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';
import { blockApi } from '../../services/post.service';
import { ProfileStackParamList } from '../../types';

type BlockedUsersNavProp = NativeStackNavigationProp<ProfileStackParamList, 'BlockedUsers'>;

interface BlockedUser {
  _id: string;
  username: string;
  name?: string;
  avatar?: string;
}

const BlockedUsersScreen: React.FC = () => {
  const navigation = useNavigation<BlockedUsersNavProp>();
  const queryClient = useQueryClient();

  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ['blockedUsers'],
    queryFn: async () => {
      return await blockApi.getBlockedUsers();
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await blockApi.unblockUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to unblock user');
    },
  });

  const handleUnblock = (userId: string) => {
    unblockMutation.mutate(userId);
  };

  const renderUser = ({ item }: { item: BlockedUser }) => {
    return (
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Icon name="person" size={24} color="#6B7280" />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.username}</Text>
            {item.name && <Text style={styles.name}>{item.name}</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblock(item._id)}
          disabled={unblockMutation.isPending && unblockMutation.variables === item._id}
        >
          {unblockMutation.isPending && unblockMutation.variables === item._id ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <Text style={styles.unblockButtonText}>Unblock</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : blockedUsers?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="shield-checkmark-outline" size={64} color="#4B5563" />
          <Text style={styles.emptyText}>No blocked users</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers || []}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
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
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: '#6B7280',
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1F2937',
  },
  defaultAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: FONT_SIZE.sm,
    color: '#9CA3AF',
    marginTop: 2,
  },
  unblockButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
    backgroundColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  unblockButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#7C3AED',
  },
});

export default BlockedUsersScreen;
