import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, ActivityIndicator, useColorScheme, Alert, Share,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import { petApi, followApi } from '../../services/post.service';
import { useAuthStore } from '../../store/authStore';
import { FONT_SIZE, SPACING, QUERY_KEYS } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_WIDTH - SPACING.xs * 2) / 3;

type Props = NativeStackScreenProps<any, 'PetProfile'>;

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🐦', rabbit: '🐰', other: '🐾',
};

const PetProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { petId } = (route.params ?? {}) as any;
  const isDark = useColorScheme() === 'dark';
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
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

  const deleteMutation = useMutation({
    mutationFn: () => petApi.deletePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MY_PETS] });
      Alert.alert('Success', 'Pet deleted successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete pet');
    },
  });

  const followMutation = useMutation({
    mutationFn: () => followApi.toggleFollow(petOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', petId] });
      Alert.alert('Success', pet?.isFollowing ? 'Unfollowed' : 'Followed successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update follow status');
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (uri: string) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: blob.type || 'image/jpeg',
        name: `pet_${Date.now()}.jpg`,
      } as any);
      return petApi.addPetPhoto(petId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', petId] });
      queryClient.invalidateQueries({ queryKey: ['petPosts', petId] });
      Alert.alert('Success', 'Photo added successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add photo');
    },
  });

  const handleChangeCoverPhoto = async () => {
    if (!isOwner) return;
    
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        videoQuality: 'high',
        selectionLimit: 1,
      });

      if (result.assets?.[0]) {
        const asset = result.assets[0];
        
        // Validate video duration (max 59 seconds)
        if (asset.type?.startsWith('video') && asset.duration) {
          if (asset.duration > 59) {
            Alert.alert(
              'Video Too Long',
              `Videos must be 59 seconds or less. The selected video is ${Math.round(asset.duration)} seconds long.`
            );
            return;
          }
        }

        if (asset.uri) {
          addPhotoMutation.mutate(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate()
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${pet?.name} on PawSpace! 🐾`,
        title: `${pet?.name}'s Profile`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        videoQuality: 'high',
        selectionLimit: 1,
      });

      if (result.assets?.[0]) {
        const asset = result.assets[0];
        
        // Validate video duration (max 59 seconds)
        if (asset.type?.startsWith('video') && asset.duration) {
          if (asset.duration > 59) {
            Alert.alert(
              'Video Too Long',
              `Videos must be 59 seconds or less. The selected video is ${Math.round(asset.duration)} seconds long.`
            );
            return;
          }
        }

        if (asset.uri) {
          addPhotoMutation.mutate(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  const handleFollow = () => {
    if (!petOwnerId) {
      Alert.alert('Error', 'Cannot follow this pet');
      return;
    }
    followMutation.mutate();
  };

  const handleMessage = () => {
    if (!pet?.owner) return;
    
    const owner = pet.owner as any;
    navigation.navigate('ChatRoom' as any, {
      recipientId: owner._id || owner.id,
      recipientName: owner.username,
      recipientAvatar: owner.avatar,
    });
  };

  const handleViewOwnerProfile = () => {
    if (!pet?.owner) return;
    
    const owner = pet.owner as any;
    const ownerId = owner._id || owner.id;
    
    // Navigate to the owner's profile
    navigation.navigate('Profile' as any, { userId: ownerId });
  };

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
  
  // Check if current user is the owner - safely compare IDs
  const petOwnerId = (pet.owner as any)?._id || (pet.owner as any)?.id;
  const userId = (currentUser as any)?._id || currentUser?.id;
  const isOwner = currentUser && petOwnerId === userId;
  
  console.log('[PetProfile] Owner check:', { 
    currentUserId: userId,
    petOwnerId,
    isOwner 
  });
  
  const posts = postsData?.items ?? [];

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover / Hero */}
        <View style={styles.hero}>
          <TouchableOpacity 
            activeOpacity={isOwner ? 0.8 : 1}
            onPress={isOwner ? handleChangeCoverPhoto : undefined}
            disabled={addPhotoMutation.isPending}
          >
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
            {isOwner && (
              <View style={styles.changeCoverOverlay}>
                {addPhotoMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Icon name="camera" size={24} color="#FFFFFF" />
                    <Text style={styles.changeCoverText}>Change Cover Photo</Text>
                  </>
                )}
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.heroOverlay} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Action buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionBtn} onPress={handleShare}>
              <Icon name="share-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity style={styles.heroActionBtn} onPress={handleDelete}>
                <Icon name="trash-outline" size={20} color="#FFFFFF" />
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
              onPress={handleViewOwnerProfile}
              activeOpacity={0.7}
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
              <Icon name="chevron-forward" size={20} color={subColor} />
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isOwner ? (
              <>
                <TouchableOpacity 
                  style={[styles.outlineBtn, { borderColor: isDark ? '#4B5563' : '#D1D5DB' }]}
                  onPress={() => navigation.navigate('EditPet' as any, { petId })}
                >
                  <Icon name="create-outline" size={18} color={textColor} style={{ marginRight: 6 }} />
                  <Text style={[styles.outlineBtnText, { color: textColor }]}>Edit profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.primaryBtn}
                  onPress={handleAddPhoto}
                  disabled={addPhotoMutation.isPending}
                >
                  {addPhotoMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryBtnText}>Add photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.primaryBtn}
                  onPress={handleFollow}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon 
                        name={pet?.isFollowing ? "checkmark-outline" : "person-add-outline"} 
                        size={18} 
                        color="#FFFFFF" 
                        style={{ marginRight: 6 }} 
                      />
                      <Text style={styles.primaryBtnText}>
                        {pet?.isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.outlineBtn, { borderColor: isDark ? '#4B5563' : '#D1D5DB' }]}
                  onPress={handleMessage}
                >
                  <Icon name="chatbubble-outline" size={18} color={textColor} style={{ marginRight: 6 }} />
                  <Text style={[styles.outlineBtnText, { color: textColor }]}>Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: cardBg, borderColor: isDark ? '#2D2D4E' : '#E5E7EB' }]}>
          {(['grid', 'reels', 'saved'] as const).map((tab) => {
            const iconName = tab === 'grid' ? 'grid-outline' : tab === 'reels' ? 'play-outline' : 'bookmark-outline';
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Icon 
                  name={iconName} 
                  size={24} 
                  color={activeTab === tab ? '#7C3AED' : subColor} 
                />
              </TouchableOpacity>
            );
          })}
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
  changeCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  changeCoverText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  backBtn: {
    position: 'absolute', top: SPACING.lg, left: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  heroActions: {
    position: 'absolute', top: SPACING.lg, right: SPACING.md,
    flexDirection: 'row', gap: SPACING.sm,
  },
  heroActionBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
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
  actionButtons: { flexDirection: 'row', gap: SPACING.sm, width: '100%' },
  primaryBtn: {
    flex: 1, backgroundColor: '#7C3AED',
    borderRadius: 14, paddingVertical: SPACING.sm,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: FONT_SIZE.sm },
  outlineBtn: {
    flex: 1, borderWidth: 1.5,
    borderRadius: 14, paddingVertical: SPACING.sm,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  outlineBtnText: { fontWeight: '700', fontSize: FONT_SIZE.sm },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1,
    marginTop: SPACING.sm,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md },
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
