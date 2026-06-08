import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AnimatedHeart from '../ui/AnimatedHeart';
import AnimatedBookmark from '../ui/AnimatedBookmark';
import { formatCount } from '../../utils/formatCount';

interface PostCardActionsProps {
  post: any;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onBookmark: () => void;
}

const PostCardActions: React.FC<PostCardActionsProps> = ({
  post,
  isLiked,
  isBookmarked,
  onLike,
  onBookmark,
}) => {
  const navigation = useNavigation<any>();

  const handleComment = () => {
    navigation.navigate('PostDetail', { postId: post._id, focusComment: true });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post on PawSpace!\npawspace://post/${post._id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.actionsRow}>
      <View style={styles.leftActions}>
        {/* Like button */}
        <View style={styles.actionBtn}>
          <AnimatedHeart isLiked={isLiked} onPress={onLike} />
          <Text style={[styles.actionCount, isLiked && styles.likedCount]}>
            {formatCount(post.likesCount || 0)}
          </Text>
        </View>

        {/* Comment button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleComment} activeOpacity={0.7}>
          <Icon name="chatbubble-outline" size={24} color="rgba(255,255,255,0.7)" />
          <Text style={styles.actionCount}>
            {formatCount(post.commentsCount || 0)}
          </Text>
        </TouchableOpacity>

        {/* Share button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
          <Icon name="paper-plane-outline" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Bookmark */}
      <AnimatedBookmark isBookmarked={isBookmarked} onPress={onBookmark} />
    </View>
  );
};

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
  likedCount: {
    color: '#EF4444',
  },
});

export default PostCardActions;
