import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Post } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 48) / 2; // 2 columns with padding

interface PostGridProps {
  posts: Post[];
}

export const PostGrid: React.FC<PostGridProps> = ({ posts }) => {
  const navigation = useNavigation();

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail' as never, { postId } as never);
  };

  return (
    <View style={styles.container}>
      {posts.map((post, index) => (
        <TouchableOpacity
          key={post.id}
          style={[
            styles.item,
            index % 2 === 0 ? styles.itemLeft : styles.itemRight,
          ]}
          onPress={() => handlePostPress(post.id)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: post.mediaUrls[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
  },
  itemLeft: {
    marginRight: 8,
  },
  itemRight: {
    marginLeft: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
