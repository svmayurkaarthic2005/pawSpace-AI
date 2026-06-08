import React, { useEffect, useRef, useCallback } from 'react';
import { Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, runOnJS,
} from 'react-native-reanimated';
import { create } from 'zustand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Toast Store ──────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'info',
  visible: false,
  show: (message, type = 'info') => set({ message, type, visible: true }),
  hide: () => set({ visible: false }),
}));

// Convenience helpers
export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, 'success'),
  error: (msg: string) => useToastStore.getState().show(msg, 'error'),
  info: (msg: string) => useToastStore.getState().show(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().show(msg, 'warning'),
};

// ─── Toast Colors ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ToastType, string> = {
  success: '#10B981',
  error: '#EF4444',
  info: '#7C3AED',
  warning: '#F59E0B',
};

const TYPE_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

// ─── Toast Component ──────────────────────────────────────────────────────────

const Toast: React.FC = () => {
  const { message, type, visible, hide } = useToastStore();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(100, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 }, () => runOnJS(hide)());
  }, [translateY, opacity, hide]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message, dismiss, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  const color = TYPE_COLORS[type];

  return (
    <Animated.View style={[styles.container, { borderLeftColor: color }, animStyle]}>
      <Text style={[styles.icon, { color }]}>{TYPE_ICONS[type]}</Text>
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
  },
  icon: { fontSize: 16, fontWeight: '700', width: 20, textAlign: 'center' },
  message: { flex: 1, color: '#F9FAFB', fontSize: 14, lineHeight: 20 },
});

export default Toast;
