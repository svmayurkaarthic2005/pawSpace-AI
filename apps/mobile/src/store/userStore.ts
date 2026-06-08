import { create } from 'zustand';
import { User } from '../types';

interface UserState {
  currentUser: User | null;
  updateUser: (updates: Partial<User>) => void;
  updateAvatar: (avatarUrl: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,

  setUser: (user) => set({ currentUser: user }),

  updateUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
    })),

  updateAvatar: (avatarUrl) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, avatarUrl } : null,
    })),

  clear: () => set({ currentUser: null }),
}));
