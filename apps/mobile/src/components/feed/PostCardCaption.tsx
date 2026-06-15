import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ParsedCaption from '../ui/ParsedCaption';

interface PostCardCaptionProps {
  post: any;
}

const PostCardCaption: React.FC<PostCardCaptionProps> = ({ post }) => {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState(false);

  if (!post.caption) return null;

  const shouldShowMore = post.caption.length > 120;

  return (
    <View style={styles.container}>
      <Text style={styles.captionText} numberOfLines={expanded ? undefined : 3}>
        <Text
          style={styles.username}
          onPress={() => navigation.push('Profile', { userId: post.author._id })}
        >
          {post.author.username}
        </Text>
        {' '}
        <ParsedCaption text={post.caption} />
      </Text>
      {shouldShowMore && !expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={styles.moreLink}>more</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  captionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  username: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreLink: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
});

export default PostCardCaption;
