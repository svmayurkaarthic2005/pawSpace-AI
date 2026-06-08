import React, { memo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import FastImage from 'react-native-fast-image';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import PostCardHeader from './PostCardHeader';
import PostCardActions from './PostCardActions';
import PostCardCaption from './PostCardCaption';
import HeartAnimation, { HeartAnimationRef } from './HeartAnimation';
import { useLikePost } from '../../hooks/useLikePost';
import { useBookmarkPost } from '../../hooks/useBookmarkPost';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: any;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const heartRef = useRef<HeartAnimationRef>(null);
  const likeMutation = useLikePost();
  const bookmarkMutation = useBookmarkPost();

  const handleDoubleTap = () => {
    heartRef.current?.trigger();
    ReactNativeHapticFeedback.trigger('impactMedium', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    
    if (!post.isLiked) {
      likeMutation.mutate(post._id);
    }
  };

  const handleLike = () => {
    likeMutation.mutate(post._id);
  };

  const handleBookmark = () => {
    bookmarkMutation.mutate(post._id);
  };

  const handleMenuPress = () => {
    // TODO: Implement action sheet menu
    Alert.alert(
      'Post Options',
      'Choose an action',
      [
        { text: 'Report', style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const imageHeight = post.aspectRatio === '4:5' 
    ? SCREEN_WIDTH * (5 / 4) 
    : SCREEN_WIDTH;

  return (
    <View style={styles.container}>
      <PostCardHeader post={post} onMenuPress={handleMenuPress} />

      <TapGestureHandler numberOfTaps={2} onActivated={handleDoubleTap}>
        <View style={[styles.mediaContainer, { height: imageHeight }]}>
          <FastImage
            source={{ uri: post.media?.[0]?.url || 'https://via.placeholder.com/400' }}
            style={styles.media}
            resizeMode={FastImage.resizeMode.cover}
          />
          <HeartAnimation ref={heartRef} />
          
          {post.isAIGenerated && (
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>✦ AI</Text>
            </View>
          )}
        </View>
      </TapGestureHandler>

      <PostCardActions
        post={post}
        isLiked={post.isLiked}
        isBookmarked={post.isBookmarked || false}
        onLike={handleLike}
        onBookmark={handleBookmark}
      />

      <PostCardCaption post={post} />

      {/* Timestamp */}
      <View style={styles.timestampContainer}>
        <Text style={styles.timestamp}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    backgroundColor: '#0D0D1A',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#1A1A2E',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(124,58,237,0.85)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  timestampContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
  },
});

// Memoize with custom comparison
export default memo(PostCard, (prevProps, nextProps) => {
  return (
    prevProps.post._id === nextProps.post._id &&
    prevProps.post.isLiked === nextProps.post.isLiked &&
    prevProps.post.likesCount === nextProps.post.likesCount &&
    prevProps.post.isBookmarked === nextProps.post.isBookmarked
  );
});
