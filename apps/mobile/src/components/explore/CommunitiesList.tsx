import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Community } from '../../types';

interface CommunitiesListProps {
  communities: Community[];
}

export const CommunitiesList: React.FC<CommunitiesListProps> = ({ communities }) => {
  const navigation = useNavigation();

  const handleCommunityPress = (communityId: string) => {
    navigation.navigate('CommunityDetail' as never, { communityId } as never);
  };

  return (
    <ScrollView
      horizontal={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {communities.map((community) => (
        <TouchableOpacity
          key={community.id}
          style={styles.card}
          onPress={() => handleCommunityPress(community.id)}
          activeOpacity={0.8}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {community.avatar ? (
              <Image source={{ uri: community.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="people" size={24} color="#7C3AED" />
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={1}>
              {community.name}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {community.description}
            </Text>

            {/* Species Tags */}
            {community.species.length > 0 && (
              <View style={styles.tagsContainer}>
                {community.species.slice(0, 3).map((species) => (
                  <View key={species} style={styles.tag}>
                    <Text style={styles.tagText}>{species}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Icon name="people-outline" size={14} color="#9CA3AF" />
                <Text style={styles.statText}>{community.memberCount} members</Text>
              </View>
              <View style={styles.stat}>
                <Icon name="chatbubbles-outline" size={14} color="#9CA3AF" />
                <Text style={styles.statText}>{community.postCount} posts</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 8,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: 'rgba(124,58,237,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#7C3AED',
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },
});
