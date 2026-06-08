import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import api from '../services/api';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface LikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<LikeResponse> => {
      const { data } = await api.post(`/posts/${postId}/like`);
      return data.data;
    },
    onMutate: async (postId: string) => {
      // Haptic feedback
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FEED });

      // Snapshot previous value
      const previousFeed = queryClient.getQueryData(QUERY_KEYS.FEED);

      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.FEED, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) => {
              if (post._id === postId) {
                const isLiked = !post.isLiked;
                const likesCount = isLiked ? post.likesCount + 1 : post.likesCount - 1;
                return { ...post, isLiked, likesCount };
              }
              return post;
            }),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (_error, _postId, context) => {
      // Revert on error
      if (context?.previousFeed) {
        queryClient.setQueryData(QUERY_KEYS.FEED, context.previousFeed);
      }
    },
    onSuccess: (data, postId) => {
      // Update with server response
      queryClient.setQueryData(QUERY_KEYS.FEED, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post._id === postId
                ? { ...post, isLiked: data.isLiked, likesCount: data.likesCount }
                : post
            ),
          })),
        };
      });
    },
  });
};
