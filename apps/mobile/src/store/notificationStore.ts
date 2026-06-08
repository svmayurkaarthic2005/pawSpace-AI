import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
// Note: All count updates should come from socket events (notification:count_update)
// to avoid race conditions. Local increment/decrement methods are kept for backward
// compatibility but should be avoided in favor of the authoritative backend count.

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count: number) => {
    // Always enforce non-negative count and log if count would be invalid
    const validCount = Math.max(0, count);
    if (count < 0) {
      console.warn('[NotificationStore] Attempted to set negative count:', count, '- clamped to 0');
    }
    set({ unreadCount: validCount });
  },

  incrementUnreadCount: () => {
    // Deprecated: Use socket count_update instead to avoid race conditions
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  decrementUnreadCount: () => {
    // Deprecated: Use socket count_update instead to avoid race conditions
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  resetUnreadCount: () => {
    set({ unreadCount: 0 });
  },
}));
