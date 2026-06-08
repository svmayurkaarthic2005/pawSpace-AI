import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface CommunityEmptyFeedProps {
  isMember: boolean;
  onCreatePost: () => void;
}

export const CommunityEmptyFeed: React.FC<CommunityEmptyFeedProps> = ({
  isMember,
  onCreatePost,
}) => {
  return (
    <View style={styles.container}>
      <Icon name="file-text" size={40} color="rgba(124, 58, 237, 0.3)" />
      <Text style={styles.title}>No posts yet</Text>
      <Text style={styles.subtitle}>
        {isMember ? 'Be the first to post in this community' : 'Join to see and create posts'}
      </Text>
      {isMember && (
        <TouchableOpacity style={styles.createPostBtn} onPress={onCreatePost} activeOpacity={0.8}>
          <Icon name="plus" color="#fff" size={16} />
          <Text style={styles.createPostText}>Create first post</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginTop: 14,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 6,
    textAlign: 'center',
  },
  createPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  createPostText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
