import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { CommunityDetail } from '../../types';
import { SpeciesBadge } from '../ui/SpeciesBadge';
import { ExpandableText } from '../ui/ExpandableText';
import { JoinButton } from '../ui/JoinButton';
import { MembersPreviewStrip } from './MembersPreviewStrip';
import { formatCount } from '../../utils/format';

interface CommunityDetailHeaderProps {
  community: CommunityDetail | null;
  isMember: boolean;
  isAdmin: boolean;
  coverParallax: Animated.AnimatedInterpolation<number>;
  onMemberCountUpdate: (delta: number) => void;
  onMembershipChange: (isMember: boolean) => void;
}

const COVER_HEIGHT = 220;

export const CommunityDetailHeader: React.FC<CommunityDetailHeaderProps> = ({
  community,
  isMember,
  isAdmin,
  coverParallax,
  onMemberCountUpdate,
  onMembershipChange,
}) => {
  const navigation = useNavigation();

  if (!community) return null;

  const handleShare = () => {
    // Implement share functionality
  };

  return (
    <View>
      {/* Cover image with parallax */}
      <View style={styles.coverContainer}>
        <Animated.View
          style={[
            styles.coverAnimated,
            {
              transform: [{ translateY: coverParallax }],
            },
          ]}
        >
          <FastImage
            source={{
              uri: community.coverImage || community.avatar || 'https://via.placeholder.com/800x440',
            }}
            style={styles.cover}
            resizeMode={FastImage.resizeMode.cover}
          />
        </Animated.View>

        {/* Gradient overlay */}
        <View style={styles.gradientOverlay} pointerEvents="none">
          <View style={{ flex: 1 }} />
          <View style={styles.gradientBottom1} />
          <View style={styles.gradientBottom2} />
          <View style={styles.gradientBottom3} />
        </View>

        {/* Back and share buttons - always visible */}
        <View style={styles.coverTopRow}>
          <TouchableOpacity
            style={styles.coverIconBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" color="#fff" size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.coverIconBtn} onPress={handleShare} activeOpacity={0.7}>
            <Icon name="share" color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Community avatar overlapping cover */}
      <View style={styles.avatarRow}>
        <View style={styles.avatarWrapper}>
          <FastImage
            source={{ uri: community.avatar || 'https://via.placeholder.com/140' }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.avatarRowRight}>
          <JoinButton
            communityId={community.id}
            isMember={isMember}
            onJoin={(data) => {
              onMembershipChange(true);
              if (data?.data?.memberCount) {
                onMemberCountUpdate(1);
              }
            }}
            onLeave={(data) => {
              onMembershipChange(false);
              if (data?.data?.memberCount !== undefined) {
                onMemberCountUpdate(-1);
              }
            }}
          />
          {isAdmin && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                (navigation as any).navigate('EditCommunity', { communityId: community.id })
              }
              activeOpacity={0.7}
            >
              <Icon name="settings" color="rgba(255, 255, 255, 0.6)" size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Community info */}
      <View style={styles.infoSection}>
        <Text style={styles.communityName}>{community.name}</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity
            onPress={() =>
              (navigation as any).navigate('CommunityMembers', { communityId: community.id })
            }
          >
            <Text style={styles.memberCount}>
              <Text style={styles.memberNumber}>{formatCount(community.memberCount ?? 0)}</Text>{' '}
              members
            </Text>
          </TouchableOpacity>
          <View style={styles.dot} />
          <View style={styles.speciesRow}>
            {community.species.map((s) => (
              <SpeciesBadge key={s} species={s} size="sm" />
            ))}
          </View>
        </View>
        {community.description && (
          <ExpandableText text={community.description} maxLines={3} style={styles.description} />
        )}
        {community.tags && community.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {community.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Members preview strip */}
      <MembersPreviewStrip communityId={community.id} />

      {/* Divider before posts */}
      <View style={styles.postsHeader}>
        <Icon name="grid" color="rgba(255, 255, 255, 0.5)" size={16} />
        <Text style={styles.postsHeaderText}>Posts</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  coverContainer: {
    height: COVER_HEIGHT,
    overflow: 'hidden',
  },
  coverAnimated: {
    height: COVER_HEIGHT + 60,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientBottom1: {
    height: 60,
    backgroundColor: 'rgba(13, 13, 26, 0.3)',
  },
  gradientBottom2: {
    height: 60,
    backgroundColor: 'rgba(13, 13, 26, 0.75)',
  },
  gradientBottom3: {
    height: 40,
    backgroundColor: 'rgba(13, 13, 26, 0.95)',
  },
  coverTopRow: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  coverIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -36,
  },
  avatarWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#0D0D1A',
    backgroundColor: '#0D0D1A',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 8,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  communityName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  memberNumber: {
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
    color: 'rgba(167, 139, 250, 0.8)',
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
  },
  postsHeaderText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
