import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SpeciesBadgeProps {
  species: string;
  size?: 'xs' | 'sm' | 'md';
}

const SPECIES_COLORS: Record<string, string> = {
  dog: '#1D9E75',
  cat: '#D85A30',
  bird: '#378ADD',
  rabbit: '#D4537E',
  fish: '#4A9ECA',
  reptile: '#8B7E3F',
  other: '#888780',
};

export const SpeciesBadge: React.FC<SpeciesBadgeProps> = ({ species, size = 'sm' }) => {
  const color = SPECIES_COLORS[species.toLowerCase()] || SPECIES_COLORS.other;
  const label = species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();

  const sizeStyles = {
    xs: { paddingHorizontal: 5, paddingVertical: 2, fontSize: 10 },
    sm: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 11 },
    md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}22`,
          borderColor: `${color}66`,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize: currentSize.fontSize }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 10,
    borderWidth: 0.5,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
});
