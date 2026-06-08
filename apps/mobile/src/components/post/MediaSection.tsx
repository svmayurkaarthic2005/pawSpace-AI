import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MediaItem } from '../../screens/feed/CreatePostScreen';
import MediaThumbnail from './MediaThumbnail';
import FilterStrip from './FilterStrip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_HEIGHT = SCREEN_WIDTH * 0.8;

interface MediaSectionProps {
  media: MediaItem[];
  onPickMedia: () => void;
  onRemoveMedia: (index: number) => void;
  onApplyFilter: (index: number, filter: string) => void;
}

const MediaSection: React.FC<MediaSectionProps> = ({
  media,
  onPickMedia,
  onRemoveMedia,
  onApplyFilter,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelectMedia = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRemove = (index: number) => {
    onRemoveMedia(index);
    if (selectedIndex >= media.length - 1) {
      setSelectedIndex(Math.max(0, media.length - 2));
    }
  };

  if (media.length === 0) {
    return (
      <TouchableOpacity style={styles.emptyContainer} onPress={onPickMedia}>
        <Icon name="image-outline" size={64} color="rgba(255,255,255,0.3)" />
        <Text style={styles.emptyTitle}>Tap to add photos or video</Text>
        <Text style={styles.emptySubtitle}>Up to 5 photos or 1 video</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mediaContainer}>
        <MediaThumbnail
          item={media[selectedIndex]}
          index={selectedIndex}
          isSelected
          onPress={() => {}}
          onRemove={handleRemove}
          showRemove
          large
        />
      </View>

      {media[selectedIndex]?.type === 'image' && (
        <FilterStrip
          selectedFilter={media[selectedIndex]?.filter || 'none'}
          onSelectFilter={(filter) => onApplyFilter(selectedIndex, filter)}
        />
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailsContainer}
      >
        {media.map((item, index) => (
          <MediaThumbnail
            key={`${item.uri}-${index}`}
            item={item}
            index={index}
            isSelected={index === selectedIndex}
            onPress={() => handleSelectMedia(index)}
            onRemove={handleRemove}
          />
        ))}
        {media.length < 5 && (
          <TouchableOpacity style={styles.addButton} onPress={onPickMedia}>
            <Icon name="add" size={28} color="#7C3AED" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyContainer: {
    height: MEDIA_HEIGHT,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  mediaContainer: {
    height: MEDIA_HEIGHT,
    width: '100%',
    backgroundColor: '#000000',
  },
  thumbnailsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  addButton: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MediaSection;
