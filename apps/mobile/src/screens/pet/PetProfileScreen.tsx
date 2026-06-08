import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  FlatList, Dimensions, ActivityIndicator, useColorScheme,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { petApi, postApi } from '../../services/post.service';
import { useAuthStore } from '../../store/authStore';
import { FONT_SIZE, SPACING } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - SPACING.xs * 2) / 3;

type Props = NativeStackScreenProps<any, 'PetProfile'>;

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐰', other: '🐾',
};

const PetProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { petId } = route.params as { petId: string };
  const isDark = useColorScheme() === 'dark';
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'grid' | 'reels' | 'saved'>('grid');

  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => petApi.getPetById(petId),
  });

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['petPosts', petId],
    queryFn: () => petApi.getPetPosts(petId),
    enabled: !!pet,
  });

  const bg = isDark ? '#080810' : '#F8F8FF';
  const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';

  if (petLoading) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <Text style={{ color: subColor }}>Pet not found</Text>
      </View>
    );
  }

  const profileImage = pet.images?.find((i: any) => i.isProfile) ?? pet.images?.[0];
  const isOwner = currentUser && pet.owner?._id === currentUser.id;
  const posts = postsData?.items ?? [];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover / Hero */}
        <View style={styles.hero}>
          {profileImage ? (
            <FastImage
              source={{ uri: profileImage.url, priority: FastImage.priority.high }}
              style={styles.coverImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: '#1A1A2E' }]}>
              <Text style={styles.coverEmoji}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionBtn}>
              <Text style={styles.heroActionIcon}>↗</Text>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity style={styles.heroActionBtn}>
                <Text style={styles.heroActionIcon}>✏</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: cardBg }]}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {profileImage ? (
              <FastImage
                source={{ uri: profileImage.url, priority: FastImage.priority.high }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarEmoji}>{SPECIES_EMOJI[pet.species] ?? '🐾'}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.petName, { color: textColor }]}>{pet.name}</Text>
          <Text style={[styles.petMeta, { color: subColor }]}>
            {[pet.breed, pet.age ? `${pet.age} yrs` : null, pet.gender]
              .filter(Boolean)
              .join(' · ')}
          </Text>

          {pet.bio ? (
            <Text style={[styles.bio, { color: subColor }]} numberOfLines={3}>
              {pet.bio}
            </Text>
          ) : null}

          {/* Species badge */}
          <View style={styles.speciesBadge}>
            <Text style={styles.speciesBadgeText}>
              {SPECIES_EMOJI[pet.species]} {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
            </Text>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: isDark ? '#2D2D4E' : '#E5E7EB' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColor }]}>{posts.length}</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Posts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? '#2D2D4E' : '#E5E7EB' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColor }]}>
                {pet.followerCount ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: isDark ? '#2D2D4E' : '#E5E7EB' }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textColor }]}>0</Text>
              <Text style={[styles.statLabel, { color: subColor }]}>Following</Text>
            </View>
          </View>

          {/* Owner */}
          {pet.owner && (
            <TouchableOpacity
              style={[styles.ownerRow, { borderColor: isDark ? '#2D2D4E' : '#E5E7EB' }]}
            >
              <Text style={[styles.ownerLabel, { color: subColor }]}>Owner</Text>
              <View style={styles.ownerInfo}>
                <FastImage
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${pet.owner.name}&background=7C3AED&color=fff`,
                    priority: FastImage.priority.normal,
                  }}
                  style={styles.ownerAvatar}
                />
                <Text style={[styles.ownerName, { color: textColor }]}>{pet.owner.username}</Text>
              </View>
              <Text style={[styles.chevron, { color: subColor }]}>›</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isOwner ? (
              <>
                <TouchableOpacity style={[styles.outlineBtn, { borderColor: isDark ? '#4B5563' : '#D1D5DB' }]}>
                  <Text style={[styles.outlineBtnText, { color: textColor }]}>Edit profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Add photo</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.outlineBtn, { borderColor: isDark ? '#4B5563' : '#D1D5DB' }]}>
                  <Text style={[styles.outlineBtnText, { color: textColor }]}>Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: cardBg, borderColor: isDark ? '#2D2D4E' : '#E5E7EB' }]}>
          {(['grid', 'reels', 'saved'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={styles.tabIcon}>
                {tab === 'grid' ? '⊞' : tab === 'reels' ? '▶' : '🔖'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Photo Grid */}
        {postsLoading ? (
          <ActivityIndicator color="#7C3AED" style={{ marginTop: SPACING.xl }} />
        ) : (
          <View style={styles.grid}>
            {posts.map((post: any) => {
              const thumb = post.media[0];
              return (
                <TouchableOpacity key={post._id} style={styles.gridItem}>
                  {thumb ? (
                    <FastImage
                      source={{ uri: thumb.thumbnail ?? thumb.url, priority: FastImage.priority.normal }}
                      style={styles.gridImage}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  ) : (
                    <View style={[styles.gridImage, { backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: '#6B7280', fontSize: 11 }}>No image</Text>
                    </View>
                  )}
                  {post.media.length > 1 && (
                    <View style={styles.multiIcon}>
                      <Text style={styles.multiIconText}>⧉</Text>
                    </View>
                  )}
                  {post.isAI && (
                    <View style={styles.aiGridBadge}>
                      <Text style={styles.aiGridBadgeText}>✦</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 260, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 80 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtn: {
    position: 'absolute', top: SPACING.lg, left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  heroActions: {
    position: 'absolute', top: SPACING.lg, right: SPACING.md,
    flexDirection: 'row', gap: SPACING.sm,
  },
  heroActionBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  heroActionIcon: { color: '#FFFFFF', fontSize: 16 },
  profileSection: { padding: SPACING.md, alignItems: 'center', marginTop: -40 },
  avatarWrapper: {
    borderWidth: 3, borderColor: '#7C3AED',
    borderRadius: 60, marginBottom: SPACING.sm,
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 48 },
  petName: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: 4 },
  petMeta: { fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
  bio: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.sm, paddingHorizontal: SPACING.md },
  speciesBadge: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 20, paddingHorizontal: SPACING.md,
    paddingVertical: 4, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)',
  },
  speciesBadgeText: { color: '#7C3AED', fontSize: FONT_SIZE.sm, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', width: '100%',
    borderTopWidth: 1, borderBottomWidth: 1,
    paddingVertical: SPACING.md, marginBottom: SPACING.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: '100%' },
  ownerRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', paddingVertical: SPACING.sm,
    borderTopWidth: 1, borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  ownerLabel: { fontSize: FONT_SIZE.sm, marginRight: SPACING.sm },
  ownerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  ownerAvatar: { width: 28, height: 28, borderRadius: 14 },
  ownerName: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  chevron: { fontSize: 20 },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  primaryBtn: {
    flex: 1, backgroundColor: '#7C3AED',
    borderRadius: 14, paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZE.sm },
  outlineBtn: {
    flex: 1, borderWidth: 1.5,
    borderRadius: 14, paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  outlineBtnText: { fontWeight: '700', fontSize: FONT_SIZE.sm },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    marginTop: SPACING.sm,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  tabIcon: { fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, padding: SPACING.xs },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, position: 'relative' },
  gridImage: { width: '100%', height: '100%', borderRadius: 4 },
  multiIcon: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4,
    padding: 2,
  },
  multiIconText: { color: '#FFFFFF', fontSize: 12 },
  aiGridBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(124,58,237,0.85)', borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  aiGridBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});

export default PetProfileScreen;
