import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Community, ExploreStackParamList } from '../../types';
import { SpeciesBadge } from '../ui/SpeciesBadge';
import { JoinButton } from '../ui/JoinButton';
import { formatCount } from '../../utils/format';

interface CommunityCardProps {
  community: Community;
  showAIBadge?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const COL_WIDTH = (screenWidth - 48) / 2;

export const CommunityCard: React.FC<CommunityCardProps> = ({ community, showAIBadge }) => {
  type NavigationProp = NativeStackNavigationProp<ExploreStackParamList, 'CommunityDetail'>;
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    navigation.navigate('CommunityDetail', {
      communityId: community.id,
      community,
    });
  };

  const handleJoin = () => {
    // Optimistic update handled by JoinButton
  };

  const handleLeave = () => {
    // Optimistic update handled by JoinButton
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: COL_WIDTH }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Cover image */}
      <View style={styles.coverWrapper}>
        <FastImage
          source={{
            uri: community.coverImage || community.avatar || 'https://via.placeholder.com/200',
          }}
          style={styles.cover}
          resizeMode={FastImage.resizeMode.cover}
        />
        {showAIBadge && (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>✦ AI</Text>
          </View>
        )}
        {community.accentColor && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: `${community.accentColor}22`,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              },
            ]}
            pointerEvents="none"
          />
        )}
      </View>

      {/* Avatar overlapping cover */}
      <View style={styles.avatarOverlap}>
        <FastImage
          source={{
            uri: community.avatar || 'https://via.placeholder.com/88',
          }}
          style={styles.avatar}
        />
      </View>

      {/* Card body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {community.description}
        </Text>
        <View style={styles.metaRow}>
          <Icon name="users" size={11} color="rgba(255, 255, 255, 0.35)" />
          <Text style={styles.memberText}>{formatCount(community.memberCount ?? 0)}</Text>
          {(community.species ?? []).slice(0, 1).map((s) => (
            <SpeciesBadge key={s} species={s} size="xs" />
          ))}
        </View>
        <JoinButton
          communityId={community.id}
          isMember={community.isMember || false}
          onJoin={handleJoin}
          onLeave={handleLeave}
          compact
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  coverWrapper: {
    width: COL_WIDTH,
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  aiBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  aiBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  avatarOverlap: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: '#0D0D1A',
  },
  body: {
    paddingTop: 30,
    paddingHorizontal: 10,
    paddingBottom: 14,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    marginBottom: 10,
  },
  memberText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.35)',
  },
});
