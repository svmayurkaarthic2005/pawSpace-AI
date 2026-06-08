import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { CommunityMembership } from '../../types';
import { SpeciesBadge } from '../ui/SpeciesBadge';
import { formatCount, formatRelativeTime } from '../../utils/format';

interface CommunityRowProps {
  item: CommunityMembership;
}

export const CommunityRow: React.FC<CommunityRowProps> = ({ item }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('CommunityDetail' as never, {
      communityId: item.community.id,
      community: item.community,
    } as never);
  };

  return (
    <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
      {/* Cover thumbnail */}
      <View style={styles.thumbWrapper}>
        <FastImage
          source={{
            uri: item.community.coverImage || item.community.avatar || 'https://via.placeholder.com/104',
          }}
          style={styles.thumb}
          resizeMode={FastImage.resizeMode.cover}
        />
        {item.hasUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.communityName} numberOfLines={1}>
            {item.community.name}
          </Text>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.memberCount}>{formatCount(item.community.memberCount)} members</Text>
          {item.community.species.slice(0, 2).map((s) => (
            <SpeciesBadge key={s} species={s} size="xs" />
          ))}
        </View>
        <Text style={styles.lastActivity} numberOfLines={1}>
          {item.hasUnread
            ? `${item.unreadCount} new ${item.unreadCount === 1 ? 'post' : 'posts'} · ${formatRelativeTime(item.community.lastActivityAt || item.community.createdAt)}`
            : `Last active ${formatRelativeTime(item.community.lastActivityAt || item.community.createdAt)}`}
        </Text>
      </View>

      <Icon name="chevron-right" color="rgba(255, 255, 255, 0.2)" size={16} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
    borderWidth: 2,
    borderColor: '#0D0D1A',
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  communityName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
  },
  adminBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: {
    fontSize: 10,
    color: '#A78BFA',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  memberCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  lastActivity: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
  },
});
