import { create } from 'zustand';
import { Post } from '../types';

interface FeedState {
  posts: Post[];
  isRefreshing: boolean;

  // Actions
  setPosts: (posts: Post[]) => void;
  prependPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  setRefreshing: (refreshing: boolean) => void;
  toggleLike: (postId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  isRefreshing: false,

  setPosts: (posts) => set({ posts }),

  prependPost: (post) =>
    set((state) => ({ posts: [post, ...state.posts] })),

  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updates } : p)),
    })),

  removePost: (postId) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) })),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  toggleLike: (postId) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p,
      ),
    })),
}));
