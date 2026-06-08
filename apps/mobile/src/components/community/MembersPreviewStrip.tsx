import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { formatCount } from '../../utils/format';

interface MembersPreviewStripProps {
  communityId: string;
}

export const MembersPreviewStrip: React.FC<MembersPreviewStripProps> = ({ communityId }) => {
  const navigation = useNavigation();

  const { data: membersData } = useQuery({
    queryKey: ['community-members-preview', communityId],
    queryFn: async () => {
      const response = await api.get(`/communities/${communityId}/members`, {
        params: { limit: 8 },
      });
      return response.data.data;
    },
    staleTime: 300_000,
    enabled: !!communityId,
  });

  const handlePress = () => {
    navigation.navigate('CommunityMembers' as never, { communityId } as never);
  };

  if (!membersData || membersData.members.length === 0) return null;

  return (
    <TouchableOpacity style={styles.strip} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.avatarsRow}>
        {membersData.members.slice(0, 6).map((m: any, i: number) => (
          <View
            key={m.user._id}
            style={[styles.memberAvatar, { marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i }]}
          >
            <FastImage
              source={{ uri: m.user.avatar || 'https://via.placeholder.com/64' }}
              style={styles.avatarImage}
            />
          </View>
        ))}
        {(membersData.total ?? 0) > 6 && (
          <View style={[styles.memberAvatar, styles.moreBadge, { marginLeft: -12, zIndex: 1 }]}>
            <Text style={styles.moreText}>+{formatCount((membersData.total ?? 0) - 6)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.membersLabel}>{formatCount(membersData.total ?? 0)} members</Text>
      <Icon name="chevron-right" color="rgba(255, 255, 255, 0.25)" size={14} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0D0D1A',
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  moreBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#A78BFA',
  },
  membersLabel: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
