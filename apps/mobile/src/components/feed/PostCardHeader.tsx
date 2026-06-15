import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatRelativeTime } from '../../utils/formatTime';
import { getSpeciesEmoji } from '../../utils/formatCount';

interface PostCardHeaderProps {
  post: any;
  onMenuPress: () => void;
}

const PostCardHeader: React.FC<PostCardHeaderProps> = ({ post, onMenuPress }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.push('Profile', { userId: post.author._id })}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: post.author.avatar || 'https://via.placeholder.com/44' }}
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{post.author.username}</Text>
            {post.pet && (
              <TouchableOpacity
                style={styles.petPill}
                onPress={() => navigation.navigate('PetProfile', { petId: post.pet._id })}
              >
                <Text style={styles.petEmoji}>{getSpeciesEmoji(post.pet.species)}</Text>
                <Text style={styles.petName}>{post.pet.name}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
        <Icon name="dots-horizontal" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textContainer: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  petPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  petEmoji: {
    fontSize: 12,
  },
  petName: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PostCardHeader;
