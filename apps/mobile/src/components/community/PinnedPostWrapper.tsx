import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { CommunityPost } from '../../types';
import { CommunityPostCard } from './CommunityPostCard';

interface PinnedPostWrapperProps {
  post: CommunityPost;
  isAdmin: boolean;
  communityId: string;
}

export const PinnedPostWrapper: React.FC<PinnedPostWrapperProps> = ({
  post,
  isAdmin,
  communityId,
}) => {
  const queryClient = useQueryClient();

  const unpinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/posts/${post._id}/unpin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
    },
  });

  const handleUnpin = () => {
    unpinMutation.mutate();
  };

  return (
    <View>
      {/* Pinned label */}
      <View style={styles.pinnedBanner}>
        <View style={styles.pinnedPill}>
          <Text style={styles.pinnedIcon}>📌</Text>
          <Text style={styles.pinnedText}>Pinned post</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity onPress={handleUnpin} disabled={unpinMutation.isPending}>
            <Text style={styles.unpinText}>
              {unpinMutation.isPending ? 'Unpinning...' : 'Unpin'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* The post itself */}
      <CommunityPostCard post={post} isAdmin={isAdmin} communityId={communityId} isPinned />
    </View>
  );
};

const styles = StyleSheet.create({
  pinnedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(186, 117, 23, 0.08)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(186, 117, 23, 0.15)',
  },
  pinnedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinnedIcon: {
    fontSize: 13,
  },
  pinnedText: {
    fontSize: 13,
    color: '#EF9F27',
    fontWeight: '500',
  },
  unpinText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
  },
});
