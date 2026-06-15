import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { UserProfile, NearbyUser } from '../../types';
import { followApi } from '../../services/post.service';

interface UsersListProps {
  users: (UserProfile | NearbyUser)[];
}

const isNearbyUser = (user: UserProfile | NearbyUser | null | undefined): user is NearbyUser => {
  return !!user && typeof user === 'object' && 'distance' in (user as any);
};

export const UsersList: React.FC<UsersListProps> = ({ users }) => {
  const navigation = useNavigation();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [followStatuses, setFollowStatuses] = useState<Record<string, 'requested' | 'following'>>({});

  const handleUserPress = (userId: string) => {
    (navigation as any).push('Profile', { userId });
  };

  const handleFollow = async (userId: string, userName: string) => {
    try {
      setLoadingId(userId);
      const res = await followApi.toggleFollow(userId);
      if (res.requested) {
        setFollowStatuses((prev) => ({ ...prev, [userId]: 'requested' }));
        Alert.alert('Requested', `Follow request sent to ${userName}`);
      } else if (res.following) {
        setFollowStatuses((prev) => ({ ...prev, [userId]: 'following' }));
        Alert.alert('Followed!', `You are now following ${userName}`);
      } else {
        setFollowStatuses((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {users.map((user: any) => (
        <TouchableOpacity
          key={user._id || user.id}
          style={styles.card}
          onPress={() => handleUserPress(user._id || user.id)}
          activeOpacity={0.8}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="person" size={24} color="#7C3AED" />
              </View>
            )}
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={16} color="#10B981" />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {user.name || user.username}
              </Text>
              {isNearbyUser(user) && (
                <View style={styles.distanceBadge}>
                  <Icon name="navigate-outline" size={12} color="#10B981" />
                  <Text style={styles.distanceText}>{user.distance}km</Text>
                </View>
              )}
            </View>

            <Text style={styles.username} numberOfLines={1}>
              @{user.username}
            </Text>

            {user.bio && (
              <Text style={styles.bio} numberOfLines={2}>
                {user.bio}
              </Text>
            )}

            {/* Stats */}
            <View style={styles.stats}>
              {user.followerCount !== undefined && (
                <View style={styles.stat}>
                  <Icon name="people-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.statText}>{user.followerCount} followers</Text>
                </View>
              )}
              {isNearbyUser(user) && user.pet && (
                <View style={styles.stat}>
                  <Icon name="paw-outline" size={14} color="#EC4899" />
                  <Text style={styles.statText}>{user.pet.name}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity 
            style={[
              styles.followButton,
              followStatuses[user._id || user.id] === 'following' && styles.followingButton,
              followStatuses[user._id || user.id] === 'requested' && styles.requestedButton
            ]}
            onPress={() => handleFollow(user._id || user.id, user.name || user.username)}
            disabled={loadingId === (user._id || user.id)}
          >
            {loadingId === (user._id || user.id) ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : followStatuses[user._id || user.id] === 'requested' ? (
              <Icon name="time-outline" size={18} color="#F59E0B" />
            ) : followStatuses[user._id || user.id] === 'following' ? (
              <Icon name="person-remove-outline" size={18} color="#10B981" />
            ) : (
              <Icon name="person-add-outline" size={18} color="#7C3AED" />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0D0D1A',
    borderRadius: 10,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#F9FAFB',
    flex: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  username: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  bio: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124,58,237,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    marginLeft: 12,
  },
  followingButton: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  requestedButton: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
});
