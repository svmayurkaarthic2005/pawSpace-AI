import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';

interface FilteredImageProps {
  uri: string;
  filter?: string;
  style?: ViewStyle;
}

// CSS filter simulation via opacity and tint overlays
const FILTERS: Record<string, { tint?: string; opacity?: number }> = {
  none: {},
  grayscale: { tint: '#888888', opacity: 0.6 },
  sepia: { tint: '#704214', opacity: 0.4 },
  warm: { tint: '#FF8C42', opacity: 0.2 },
  cool: { tint: '#42A5F5', opacity: 0.2 },
  vivid: {},
};

const FilteredImage: React.FC<FilteredImageProps> = ({ uri, filter = 'none', style }) => {
  const filterStyle = FILTERS[filter] || FILTERS.none;

  return (
    <View style={[styles.container, style]}>
      <FastImage source={{ uri }} style={styles.image} resizeMode="cover" />
      {filterStyle.tint && (
        <View
          style={[
            styles.overlay,
            { backgroundColor: filterStyle.tint, opacity: filterStyle.opacity },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default FilteredImage;
