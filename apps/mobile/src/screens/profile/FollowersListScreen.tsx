import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZE } from '../../constants';
import api from '../../services/api';
import { followApi } from '../../services/post.service';
import { useAuthStore } from '../../store/authStore';
import { ProfileStackParamList } from '../../types';

type FollowersListRouteProp = RouteProp<ProfileStackParamList, 'FollowersList'>;
type FollowersListNavProp = NativeStackNavigationProp<ProfileStackParamList, 'FollowersList'>;

interface FollowUser {
  _id: string;
  id: string;
  username: string;
  name?: string;
  avatar?: string;
  bio?: string;
  isFollowing?: boolean;
}

const FollowersListScreen: React.FC = () => {
  const route = useRoute<FollowersListRouteProp>();
  const navigation = useNavigation<FollowersListNavProp>();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { userId, type } = (route.params ?? {}) as any;
  const isCurrentUserProfile = userId === currentUser?.id || userId === currentUser?._id;
  
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(type);

  // Fetch followers
  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      const { data } = await api.get(`/follows/users/${userId}/followers`);
      return data.data;
    },
    enabled: !!userId,
  });

  // Fetch following
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      const { data } = await api.get(`/follows/users/${userId}/following`);
      return data.data;
    },
    enabled: !!userId,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return await followApi.toggleFollow(targetUserId);
    },
    onSuccess: () => {
      // Invalidate queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  // Remove Follower mutation
  const removeFollowerMutation = useMutation({
    mutationFn: async (followerId: string) => {
      return await followApi.removeFollower(followerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });

  const currentData = activeTab === 'followers' ? followersData : followingData;
  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading;

  const handleFollow = (targetUserId: string) => {
    followMutation.mutate(targetUserId);
  };

  const handleRemoveFollower = (followerId: string) => {
    removeFollowerMutation.mutate(followerId);
  };

  const renderUser = ({ item }: { item: FollowUser }) => {
    const isCurrentUser = (item._id || item.id) === (currentUser?.id || currentUser?._id);
    
    return (
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => {
          navigation.navigate('ProfileHome', { userId: item._id || item.id } as any);
        }}
      >
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
            {item.bio && (
              <Text style={styles.bio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}
          </View>
        </View>

        {!isCurrentUser && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isCurrentUserProfile && activeTab === 'followers' && (
              <TouchableOpacity
                style={[styles.followButton, styles.removeButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveFollower(item._id || item.id);
                }}
                disabled={removeFollowerMutation.isPending}
              >
                {removeFollowerMutation.isPending && removeFollowerMutation.variables === (item._id || item.id) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.followButtonText}>Remove</Text>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.followButton,
                item.isFollowing && styles.followingButton,
                isCurrentUserProfile && activeTab === 'followers' && { marginLeft: 8 }
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleFollow(item._id || item.id);
              }}
              disabled={followMutation.isPending}
            >
              {followMutation.isPending && followMutation.variables === (item._id || item.id) ? (
                <ActivityIndicator size="small" color={item.isFollowing ? '#7C3AED' : '#FFFFFF'} />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    item.isFollowing && styles.followingButtonText,
                  ]}
                >
                  {item.isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'followers' && styles.activeTabText,
            ]}
          >
            Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'following' && styles.activeTabText,
            ]}
          >
            Following
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : currentData?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon
            name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
            size={64}
            color="#4B5563"
          />
          <Text style={styles.emptyText}>
            No {activeTab === 'followers' ? 'followers' : 'following'} yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData || []}
          renderItem={renderUser}
          keyExtractor={(item) => item._id || item.id}
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#7C3AED',
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
  bio: {
    fontSize: FONT_SIZE.xs,
    color: '#6B7280',
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  followButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#7C3AED',
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
});

export default FollowersListScreen;
