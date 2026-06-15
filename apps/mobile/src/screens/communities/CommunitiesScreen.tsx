import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ScrollView, ActivityIndicator, useColorScheme,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useTheme } from '../../constants/theme';
import { formatCount } from '../../utils';

type Props = NativeStackScreenProps<any, 'Communities'>;

interface Community {
  _id: string;
  name: string;
  slug: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  postCount: number;
  species: string[];
  tags: string[];
  isPrivate: boolean;
  isMember?: boolean;
  lastPost?: { createdAt: string };
}

const SPECIES_FILTERS = ['All', 'Dogs', 'Cats', 'Birds', 'Rabbits'];

const CommunitiesScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'mine' | 'discover'>('mine');
  const [speciesFilter, setSpeciesFilter] = useState('All');

  const { data: myCommunities = [], isLoading: myLoading } = useQuery({
    queryKey: ['myCommunities'],
    queryFn: async () => {
      const { data } = await api.get('/communities/mine');
      return data.data as Community[];
    },
  });

  const { data: discoverCommunities = [], isLoading: discoverLoading } = useQuery({
    queryKey: ['discoverCommunities', speciesFilter],
    queryFn: async () => {
      const params = speciesFilter !== 'All' ? `?species=${speciesFilter.toLowerCase().slice(0, -1)}` : '';
      const { data } = await api.get(`/communities/discover${params}`);
      return data.data as Community[];
    },
    enabled: activeTab === 'discover',
  });

  const joinMutation = useMutation({
    mutationFn: (communityId: string) => api.post(`/communities/${communityId}/join`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['myCommunities'] });
      void queryClient.invalidateQueries({ queryKey: ['discoverCommunities'] });
    },
  });

  const bg = colors.background;
  const textColor = colors.textPrimary;
  const subColor = colors.textSecondary;
  const cardBg = colors.surface;

  const renderCommunityRow = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={[styles.communityRow, { backgroundColor: cardBg }]}
      onPress={() => navigation.navigate('CommunityDetail', { communityId: item._id })}
      activeOpacity={0.75}
    >
      {item.avatar ? (
        <FastImage source={{ uri: item.avatar, priority: FastImage.priority.normal }} style={styles.communityAvatar} />
      ) : (
        <View style={[styles.communityAvatar, { backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 28 }}>🐾</Text>
        </View>
      )}
      <View style={styles.communityInfo}>
        <Text style={[styles.communityName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.tagsRow}>
          {(item.species ?? []).slice(0, 2).map((s) => (
            <View key={s} style={[styles.speciesTag, { backgroundColor: colors.primarySurface }]}>
              <Text style={[styles.speciesTagText, { color: colors.primary }]}>{s}</Text>
            </View>
          ))}
          {(item.tags ?? []).slice(0, 1).map((t) => (
            <View key={t} style={[styles.speciesTag, { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
              <Text style={[styles.speciesTagText, { color: subColor }]}>{t}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.communityMeta, { color: subColor }]}>
          {formatCount(item.memberCount ?? 0)} members · New post {item.lastPost ? '2h ago' : 'recently'}
        </Text>
      </View>
      {item.isMember ? (
        <View style={[styles.memberBadge, { backgroundColor: colors.primarySurface }]}>
          <Text style={[styles.memberBadgeText, { color: colors.primary }]}>●</Text>
        </View>
      ) : null}
      <Text style={[styles.chevron, { color: subColor }]}>›</Text>
    </TouchableOpacity>
  );

  const renderDiscoverCard = ({ item }: { item: Community }) => (
    <TouchableOpacity
      style={[styles.discoverCard, { backgroundColor: cardBg }]}
      onPress={() => navigation.navigate('CommunityDetail', { communityId: item._id })}
    >
      {item.avatar ? (
        <FastImage source={{ uri: item.avatar, priority: FastImage.priority.normal }} style={styles.discoverImage} />
      ) : (
        <View style={[styles.discoverImage, { backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 36 }}>🐾</Text>
        </View>
      )}
      <Text style={[styles.discoverName, { color: textColor }]} numberOfLines={2}>{item.name}</Text>
      <Text style={[styles.discoverMeta, { color: subColor }]}>{formatCount(item.memberCount ?? 0)} members</Text>
      <TouchableOpacity
        style={[styles.joinBtn, { backgroundColor: colors.primary }]}
        onPress={() => joinMutation.mutate(item._id)}
      >
        <Text style={styles.joinBtnText}>Join</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bg }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Communities</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={[styles.headerBtnIcon, { color: textColor }]}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={[styles.headerBtnIcon, { color: textColor }]}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mine' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'mine' ? colors.primary : subColor }]}>My communities</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'discover' ? colors.primary : subColor }]}>Discover</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'mine' ? (
        myLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={myCommunities}
            keyExtractor={(item) => item._id}
            renderItem={renderCommunityRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.divider }]} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏘️</Text>
                <Text style={[styles.emptyText, { color: subColor }]}>No communities yet</Text>
                <TouchableOpacity onPress={() => setActiveTab('discover')}>
                  <Text style={[styles.emptyAction, { color: colors.primary }]}>Discover communities →</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
          {/* Species filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {SPECIES_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: speciesFilter === f ? colors.primary : colors.surface,
                    borderColor: speciesFilter === f ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSpeciesFilter(f)}
              >
                <Text style={[styles.filterChipText, { color: speciesFilter === f ? '#FFFFFF' : subColor }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* AI Picks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Recommended for you</Text>
              <View style={[styles.aiPicksBadge, { backgroundColor: colors.primarySurface }]}>
                <Text style={[styles.aiPicksText, { color: colors.primary }]}>✦ AI picks</Text>
              </View>
            </View>
            {discoverLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={styles.discoverGrid}>
                {discoverCommunities.slice(0, 4).map((item: Community) => (
                  <View key={item._id} style={{ width: '48%' }}>
                    {renderDiscoverCard({ item })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 4 },
  headerBtnIcon: { fontSize: 20 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '600' },
  communityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  communityAvatar: { width: 56, height: 56, borderRadius: 12 },
  communityInfo: { flex: 1 },
  communityName: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tagsRow: { flexDirection: 'row', gap: 4, marginBottom: 4, flexWrap: 'wrap' },
  speciesTag: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  speciesTagText: { fontSize: 10, fontWeight: '600' },
  communityMeta: { fontSize: 11 },
  memberBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3 },
  memberBadgeText: { fontSize: 12 },
  chevron: { fontSize: 20 },
  separator: { height: 1, marginLeft: 84 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginRight: 8, borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  aiPicksBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  aiPicksText: { fontSize: 11, fontWeight: '700' },
  discoverGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  discoverCard: { borderRadius: 16, padding: 12, alignItems: 'center' },
  discoverImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  discoverName: { fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  discoverMeta: { fontSize: 11, marginBottom: 8 },
  joinBtn: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 6, width: '100%', alignItems: 'center' },
  joinBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16 },
  emptyAction: { fontSize: 14, fontWeight: '600' },
});

export default CommunitiesScreen;
