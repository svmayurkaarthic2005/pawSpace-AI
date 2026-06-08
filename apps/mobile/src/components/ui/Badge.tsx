import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  count?: number;
  label?: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  maxCount?: number;
}

const Badge: React.FC<BadgeProps> = ({
  count,
  label,
  color = '#7C3AED',
  textColor = '#FFFFFF',
  style,
  maxCount = 99,
}) => {
  const displayText =
    label ?? (count !== undefined ? (count > maxCount ? `${maxCount}+` : String(count)) : '');

  if (!displayText) return null;

  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{displayText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});

export default Badge;
