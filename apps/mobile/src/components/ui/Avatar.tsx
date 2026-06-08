import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

const FONT_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 36,
};

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  isOnline?: boolean;
  style?: ViewStyle;
  borderColor?: string;
  borderWidth?: number;
}

const getInitials = (name?: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
};

const getColorFromName = (name?: string): string => {
  const colors = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'];
  if (!name) return colors[0];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  isOnline,
  style,
  borderColor,
  borderWidth,
}) => {
  const dim = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const dotSize = Math.max(8, Math.round(dim * 0.22));

  const containerStyle: ViewStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
    ...(borderColor && { borderWidth: borderWidth ?? 2, borderColor }),
    ...style,
  };

  return (
    <View style={[styles.wrapper, { width: dim + (borderColor ? 4 : 0), height: dim + (borderColor ? 4 : 0) }]}>
      {uri ? (
        <FastImage
          source={{ uri, priority: FastImage.priority.normal }}
          style={[styles.image, containerStyle] as any}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            containerStyle,
            { backgroundColor: getColorFromName(name) },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
        </View>
      )}
      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: isOnline ? '#10B981' : '#6B7280',
              bottom: borderColor ? 2 : 0,
              right: borderColor ? 2 : 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative' },
  image: { 
    overflow: 'hidden',
  },
  fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { color: '#FFFFFF', fontWeight: '700' },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#0D0D1A',
  },
});

export default Avatar;
