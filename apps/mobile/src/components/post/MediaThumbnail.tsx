import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { MediaItem } from '../../screens/feed/CreatePostScreen';
import FilteredImage from './FilteredImage';
import VideoPreview from './VideoPreview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MediaThumbnailProps {
  item: MediaItem;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  onRemove: (index: number) => void;
  showRemove?: boolean;
  large?: boolean;
}

const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  item,
  index,
  isSelected,
  onPress,
  onRemove,
  showRemove = false,
  large = false,
}) => {
  const containerStyle = large ? styles.largeContainer : styles.container;

  return (
    <TouchableOpacity
      style={[containerStyle, isSelected && !large && styles.selectedBorder]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {item.type === 'video' ? (
        <VideoPreview uri={item.uri} style={large ? styles.largeMedia : styles.media} />
      ) : (
        <FilteredImage
          uri={item.uri}
          filter={item.filter}
          style={large ? styles.largeMedia : styles.media}
        />
      )}

      {showRemove && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(index)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close-circle" size={28} color="#EF4444" />
        </TouchableOpacity>
      )}

      {item.type === 'video' && !large && (
        <View style={styles.videoBadge}>
          <Icon name="play-circle" size={20} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBorder: {
    borderColor: '#7C3AED',
  },
  largeContainer: {
    width: '100%',
    height: '100%',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  largeMedia: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 2,
  },
});

export default MediaThumbnail;
