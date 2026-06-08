import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { CommunityPost } from '../../types';
import { formatRelativeTime, formatCount } from '../../utils/format';

interface CommunityPostCardProps {
  post: CommunityPost;
  isAdmin: boolean;
  communityId: string;
  isPinned?: boolean;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  isAdmin,
  communityId,
  isPinned = false,
}) => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/posts/${post._id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${communityId}/posts/${post._id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/posts/${post._id}/pin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handlePin = () => {
    Alert.alert('Pin Post', 'Pin this post to the top of the community?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Pin', onPress: () => pinMutation.mutate() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  const handleAuthorPress = () => {
    (navigation as any).navigate('Profile', { userId: post.author._id });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAuthorPress} style={styles.authorInfo}>
          <FastImage
            source={{ uri: post.author.avatar || 'https://via.placeholder.com/80' }}
            style={styles.avatar}
          />
          <View style={styles.authorText}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{post.author.name || post.author.username}</Text>
              {post.author.isVerified && (
                <Icon name="check-circle" size={14} color="#7C3AED" />
              )}
            </View>
            <Text style={styles.communityLabel}>in {post.community.name}</Text>
            <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity onPress={() => {}} style={styles.moreBtn}>
            <Icon name="more-horizontal" size={20} color="rgba(255, 255, 255, 0.5)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <FastImage
            source={{ uri: post.media[0].url }}
            style={styles.media}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleLike}
          style={styles.actionBtn}
          disabled={likeMutation.isPending}
        >
          <Icon
            name="heart"
            size={20}
            color={post.isLiked ? '#EF4444' : 'rgba(255, 255, 255, 0.5)'}
          />
          {post.likesCount > 0 && <Text style={styles.actionCount}>{formatCount(post.likesCount)}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="message-circle" size={20} color="rgba(255, 255, 255, 0.5)" />
          {post.commentsCount > 0 && (
            <Text style={styles.actionCount}>{formatCount(post.commentsCount)}</Text>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {isAdmin && !isPinned && (
          <TouchableOpacity onPress={handlePin} style={styles.actionBtn}>
            <Icon name="bookmark" size={18} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>
        )}

        {isAdmin && (
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Icon name="trash-2" size={18} color="rgba(239, 68, 68, 0.6)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D0D1A',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  authorText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  communityLabel: {
    fontSize: 11,
    color: 'rgba(124, 58, 237, 0.8)',
    marginTop: 1,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 1,
  },
  moreBtn: {
    padding: 4,
  },
  content: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  media: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
