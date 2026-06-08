import { useColorScheme } from 'react-native';

// ─── Color Palettes ───────────────────────────────────────────────────────────

export const LightColors = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primarySurface: 'rgba(124,58,237,0.08)',

  background: '#F8F7FF',
  surface: '#FFFFFF',
  surfaceElevated: 'rgba(255,255,255,0.85)',
  surfaceOverlay: 'rgba(255,255,255,0.6)',

  textPrimary: '#0D0D1A',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textAccent: '#7C3AED',

  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.16)',
  divider: 'rgba(0,0,0,0.06)',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  online: '#10B981',
  offline: '#6B7280',

  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.08)',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#9CA3AF',

  shimmerBase: '#E5E7EB',
  shimmerHighlight: '#F9FAFB',

  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
} as const;

export const DarkColors = {
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primarySurface: 'rgba(124,58,237,0.15)',

  background: '#0D0D1A',
  surface: '#1A1A2E',
  surfaceElevated: 'rgba(255,255,255,0.05)',
  surfaceOverlay: 'rgba(255,255,255,0.08)',

  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#6B7280',
  textInverse: '#0D0D1A',
  textAccent: '#A78BFA',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  divider: 'rgba(255,255,255,0.06)',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  online: '#10B981',
  offline: '#4B5563',

  tabBar: '#0D0D1A',
  tabBarBorder: 'rgba(255,255,255,0.08)',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#4B5563',

  shimmerBase: '#1E1E35',
  shimmerHighlight: '#2D2D4E',

  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
} as const;

export type ThemeColors = typeof LightColors;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  h4: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  purple: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── useTheme hook ────────────────────────────────────────────────────────────

export const useTheme = () => {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    colors: isDark ? DarkColors : LightColors,
    spacing: Spacing,
    radius: BorderRadius,
    typography: Typography,
    shadows: Shadows,
    isDark,
  };
};
