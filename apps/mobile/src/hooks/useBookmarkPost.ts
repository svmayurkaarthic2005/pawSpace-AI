import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants';
import api from '../services/api';

interface BookmarkResponse {
  isBookmarked: boolean;
}

export const useBookmarkPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string): Promise<BookmarkResponse> => {
      const { data } = await api.post(`/posts/${postId}/bookmark`);
      return data.data;
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.FEED });

      const previousFeed = queryClient.getQueryData(QUERY_KEYS.FEED);

      queryClient.setQueryData(QUERY_KEYS.FEED, (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post._id === postId
                ? { ...post, isBookmarked: !post.isBookmarked }
                : post
            ),
          })),
        };
      });

      return { previousFeed };
    },
    onError: (_error, _postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(QUERY_KEYS.FEED, context.previousFeed);
      }
    },
  });
};
