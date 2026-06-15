import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZE, QUERY_KEYS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { petApi } from '../../services/post.service';
import { chatApi } from '../../services/chat.api';
import { blockApi } from '../../services/post.service';
import { ProfileStackParamList } from '../../types';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 6) / 3;

type ProfileScreenNavProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;
type ProfileScreenRouteProp = RouteProp<ProfileStackParamList, 'ProfileHome'>;

interface Pet {
  _id: string;
  name: string;
  breed?: string;
  species: string;
  images: Array<{ url: string; publicId: string; isProfile: boolean }>;
}

interface Post {
  _id: string;
  media: Array<{ url: string; type: 'image' | 'video' }>;
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  locationName?: string;
  website?: string;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  petCount: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'tagged'>('posts');
  const [menuVisible, setMenuVisible] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [showMoreLink, setShowMoreLink] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<ProfileScreenNavProp>();
  const route = useRoute<ProfileScreenRouteProp>();
  const queryClient = useQueryClient();
  
  // Get userId from route params, fallback to logged-in user
  const userId = (route.params as any)?.userId || user?.id;
  const isOwnProfile = userId === user?.id;

  // Fetch user profile
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery<UserProfile>({
    queryKey: [QUERY_KEYS.USER_PROFILE, userId],
    queryFn: async () => {
      const { data } = await api.get<{ data: UserProfile }>(`/users/${userId}/profile`);
      return data.data;
    },
    enabled: !!userId,
    retry: 1,
  });

  // Fetch user's pets
  const { data: pets = [], isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: [QUERY_KEYS.MY_PETS, userId],
    queryFn: isOwnProfile ? petApi.getMyPets : async () => {
      const { data } = await api.get<{ data: Pet[] }>(`/pets?userId=${userId}`);
      return data.data;
    },
    retry: 1,
    enabled: !!userId,
  });

  // Fetch user's posts
  const { data: postsData, isLoading: postsLoading } = useQuery<{ items: Post[]; total: number }>({
    queryKey: [QUERY_KEYS.USER_POSTS, userId],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: Post[]; total: number } }>(
        `/posts?userId=${userId}&limit=30`
      );
      return data.data;
    },
    enabled: !!userId,
    retry: 1,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/follows/users/${userId}`);
      return data.data;
    },
    onSuccess: (data: { following: boolean; followerCount: number }) => {
      // Update profile in cache
      queryClient.setQueryData([QUERY_KEYS.USER_PROFILE, userId], (old: any) => ({
        ...old,
        isFollowing: data.following,
        followerCount: data.followerCount,
      }));
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
    onError: (error: any) => {
      console.error('Follow error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to follow user');
    },
  });

  const posts = postsData?.items || [];
  const postsCount = postsData?.total || 0;

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (profile?.isBlocked) {
        return await blockApi.unblockUser(userId);
      } else {
        return await blockApi.blockUser(userId);
      }
    },
    onSuccess: () => {
      Alert.alert('Success', `User ${profile?.isBlocked ? 'unblocked' : 'blocked'} successfully.`);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE, userId] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      if (!profile?.isBlocked) {
        // Go back if blocked (optional, but requested by earlier logic), but wait, maybe not go back, just re-render
        // Actually, if blocked, it's better to just refresh so the user can see it's blocked
      }
    },
    onError: (error: any) => {
      console.error('Block error:', error);
      Alert.alert('Error', error.response?.data?.message || `Failed to ${profile?.isBlocked ? 'unblock' : 'block'} user`);
    },
  });

  const handleFollow = () => {
    followMutation.mutate();
  };

  const handleMessage = async () => {
    if (!profile) return;
    try {
      setIsMessaging(true);
      const chat = await chatApi.getOrCreateChat(profile.id);
      navigation.navigate('ChatRoom', {
        chatId: chat._id,
        otherUser: {
          _id: profile.id,
          username: profile.username,
          name: profile.name || profile.username,
          avatar: profile.avatar,
        },
      } as any);
    } catch (error) {
      console.error('Message error:', error);
      Alert.alert('Error', 'Could not start conversation');
    } finally {
      setIsMessaging(false);
    }
  };

  const handleShare = async () => {
    setMenuVisible(false);
    
    if (!profile) return;
    
    try {
      const shareUrl = `pawspace://profile/${userId}`;
      const message = `Check out ${profile.name}'s profile on PawSpace! @${profile.username}`;
      
      const result = await Share.share({
        message: `${message}\n${shareUrl}`,
        title: `${profile.name} on PawSpace`,
        url: shareUrl, // iOS only
      });

      if (result.action === Share.sharedAction) {
        console.log('Profile shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error: any) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share profile');
    }
  };

  const handleSettings = () => {
    setMenuVisible(false);
    navigation.navigate('Settings');
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleBlockUser = () => {
    setMenuVisible(false);
    if (profile?.isBlocked) {
      blockMutation.mutate();
    } else {
      Alert.alert(
        'Block User',
        `Are you sure you want to block @${profile?.username}? They will no longer be able to follow you or view your content.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Block', 
            style: 'destructive',
            onPress: () => blockMutation.mutate()
          }
        ]
      );
    }
  };

  const handleTextLayout = (e: any) => {
    // Check if text is truncated (more than 3 lines)
    if (e.nativeEvent.lines.length > 3) {
      setShowMoreLink(true);
    }
  };

  const toggleBio = () => {
    setBioExpanded(!bioExpanded);
  };

  if (profileLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void refetchProfile()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo & Header */}
        <View style={styles.coverContainer}>
          {profile.coverImage ? (
            <Image source={{ uri: profile.coverImage }} style={styles.coverPhoto} />
          ) : (
            <View style={[styles.coverPhoto, styles.defaultCover]} />
          )}
          
          {/* Header Icons */}
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setMenuVisible(true)}
            >
              <Icon name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Picture */}
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Icon name="person" size={40} color="#6B7280" />
              </View>
            )}
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.isVerified && (
              <MaterialCommunityIcons name="check-decagram" size={20} color="#7C3AED" />
            )}
          </View>
          
          <View style={styles.usernameRow}>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="paw" size={12} color="#7C3AED" />
                <Text style={styles.verifiedText}>Verified pet owner</Text>
              </View>
            )}
          </View>

          {profile.bio && (
            <View>
              <Text 
                style={styles.bio} 
                numberOfLines={bioExpanded ? undefined : 3}
                onTextLayout={handleTextLayout}
              >
                {profile.bio}
              </Text>
              {showMoreLink && (
                <TouchableOpacity onPress={toggleBio}>
                  <Text style={styles.moreText}>
                    {bioExpanded ? 'less' : 'more'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Location */}
          {profile.locationName && (
            <View style={styles.metaRow}>
              <Icon name="location-outline" size={16} color="#9CA3AF" style={styles.metaIcon} />
              <Text style={styles.metaText}>{profile.locationName}</Text>
            </View>
          )}

          {/* Website */}
          {profile.website && (
            <View style={styles.metaRow}>
              <Icon name="link" size={16} color="#9CA3AF" />
              <Text style={styles.metaLink}>{profile.website}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{postsCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('FollowersList', { userId, type: 'followers' })}
            >
              <Text style={styles.statNumber}>{profile.followerCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('FollowersList', { userId, type: 'following' })}
            >
              <Text style={styles.statNumber}>{profile.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* Pets Section */}
          {pets.length > 0 && (
            <View style={styles.petsSection}>
              <View style={styles.petsSectionHeader}>
                <Text style={styles.petsTitle}>Pets</Text>
                {pets.length > 3 && (
                  <Text style={styles.petCount}>{pets.length} pets</Text>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll}>
                {pets.map((pet: any) => {
                  const profileImage = pet.images.find((img: any) => img.isProfile) || pet.images[0];
                  return (
                    <TouchableOpacity 
                      key={pet._id} 
                      style={styles.petItem}
                      onPress={() => navigation.navigate('PetProfile', { petId: pet._id })}
                    >
                      <View style={styles.petImageContainer}>
                        <Image 
                          source={{ uri: profileImage?.url || 'https://via.placeholder.com/150' }} 
                          style={styles.petImage} 
                        />
                      </View>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Text style={styles.petBreed}>{pet.breed || pet.species}</Text>
                    </TouchableOpacity>
                  );
                })}
                
                {/* Add Pet Button */}
                {isOwnProfile && (
                  <TouchableOpacity 
                    style={styles.addPetButton}
                    onPress={() => navigation.navigate('AddPet')}
                  >
                    <View style={styles.addPetCircle}>
                      <Icon name="add" size={32} color="#7C3AED" />
                    </View>
                    <Text style={styles.addPetText}>Add pet</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}

          {/* No Pets State */}
          {pets.length === 0 && !petsLoading && (
            <View style={styles.noPetsContainer}>
              <MaterialCommunityIcons name="paw-off-outline" size={48} color="#4B5563" />
              <Text style={styles.noPetsText}>No pets added yet</Text>
              {isOwnProfile && (
                <TouchableOpacity 
                  style={styles.addFirstPetButton}
                  onPress={() => {
                    console.log('Add first pet button pressed');
                    navigation.navigate('AddPet');
                  }}
                >
                  <Icon name="add-circle-outline" size={20} color="#7C3AED" />
                  <Text style={styles.addFirstPetText}>Add your first pet</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {isOwnProfile ? (
            <>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>Edit profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Icon name="share-outline" size={18} color="#7C3AED" />
                <Text style={styles.shareButtonText}>Share profile</Text>
              </TouchableOpacity>
            </>
          ) : profile?.isBlocked ? (
            <View style={styles.noPetsContainer}>
              <Text style={styles.noPetsText}>You have blocked this user.</Text>
            </View>
          ) : (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={[
                  styles.followButton, 
                  profile?.isFollowing && styles.followingButton
                ]} 
                onPress={handleFollow}
                disabled={followMutation.isPending}
              >
                {followMutation.isPending ? (
                  <ActivityIndicator size="small" color={profile?.isFollowing ? '#7C3AED' : '#FFFFFF'} />
                ) : (
                  <>
                    <Icon 
                      name={profile?.isFollowing ? 'checkmark' : 'person-add'} 
                      size={18} 
                      color={profile?.isFollowing ? '#7C3AED' : '#FFFFFF'} 
                    />
                    <Text style={[
                      styles.followButtonText,
                      profile?.isFollowing && styles.followingButtonText
                    ]}>
                      {profile?.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.messageButton}
                onPress={handleMessage}
                disabled={isMessaging}
              >
                {isMessaging ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="mail-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.messageButtonText}>Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <MaterialCommunityIcons name="grid" size={22} color={activeTab === 'posts' ? '#7C3AED' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Posts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
            onPress={() => setActiveTab('tagged')}
          >
            <MaterialCommunityIcons name="tag-outline" size={22} color={activeTab === 'tagged' ? '#7C3AED' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'tagged' && styles.activeTabText]}>Tagged</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Grid */}
        {postsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="image-off-outline" size={64} color="#4B5563" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Share your first moment with your pets!</Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {posts.map((post: any) => {
              const media = post.media[0];
              return (
                <TouchableOpacity key={post._id} style={styles.photoItem}>
                  <Image source={{ uri: media.url }} style={styles.photoImage} />
                  {media.type === 'video' && (
                    <View style={styles.videoIcon}>
                      <Icon name="play-circle" size={24} color="#FFFFFF" />
                    </View>
                  )}
                  {post.media.length > 1 && (
                    <View style={styles.multipleIcon}>
                      <MaterialCommunityIcons name="layers" size={20} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Three-Dot Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleShare}
            >
              <Icon name="share-outline" size={22} color="#FFFFFF" />
              <Text style={styles.menuText}>Share profile</Text>
            </TouchableOpacity>

            {!isOwnProfile && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleBlockUser}
                  disabled={blockMutation.isPending}
                >
                  <Icon name={profile?.isBlocked ? "checkmark-circle-outline" : "ban-outline"} size={22} color={profile?.isBlocked ? "#10B981" : "#EF4444"} />
                  <Text style={[styles.menuText, !profile?.isBlocked && styles.logoutText, profile?.isBlocked && { color: '#10B981' }]}>
                    {blockMutation.isPending ? 'Processing...' : profile?.isBlocked ? 'Unblock user' : 'Block user'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {isOwnProfile && (
              <>
                <View style={styles.menuDivider} />

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleSettings}
                >
                  <Icon name="settings-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.menuText}>Settings</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <Icon name="log-out-outline" size={22} color="#EF4444" />
                  <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: '#9CA3AF',
    marginTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: '#EF4444',
    marginTop: SPACING.md,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
  },
  defaultCover: {
    backgroundColor: '#1F2937',
  },
  headerIcons: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -40,
    left: SPACING.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#0D0D1A',
    backgroundColor: '#1F2937',
  },
  defaultAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  username: {
    fontSize: FONT_SIZE.md,
    color: '#9CA3AF',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#7C3AED',
  },
  bio: {
    fontSize: FONT_SIZE.md,
    color: '#D1D5DB',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  moreText: {
    fontSize: FONT_SIZE.sm,
    color: '#7C3AED',
    marginTop: 4,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: FONT_SIZE.sm,
    color: '#9CA3AF',
  },
  metaLink: {
    fontSize: FONT_SIZE.sm,
    color: '#7C3AED',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1F2937',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: '#9CA3AF',
    marginTop: 4,
  },
  petsSection: {
    marginTop: SPACING.lg,
  },
  petsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  petsTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  petCount: {
    fontSize: FONT_SIZE.sm,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  seeAll: {
    fontSize: FONT_SIZE.md,
    color: '#7C3AED',
  },
  petsScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  petItem: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  petImageContainer: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  petImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1F2937',
  },
  petName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: SPACING.xs,
  },
  petBreed: {
    fontSize: FONT_SIZE.xs,
    color: '#9CA3AF',
  },
  addPetButton: {
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addPetCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPetText: {
    fontSize: FONT_SIZE.sm,
    color: '#7C3AED',
    marginTop: SPACING.xs,
  },
  noPetsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noPetsText: {
    fontSize: FONT_SIZE.md,
    color: '#6B7280',
    marginTop: SPACING.md,
  },
  addFirstPetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  addFirstPetText: {
    fontSize: FONT_SIZE.md,
    color: '#7C3AED',
    fontWeight: '600',
  },
  editButton: {
    marginTop: SPACING.lg,
    backgroundColor: '#7C3AED',
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareButton: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    gap: 8,
  },
  shareButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#7C3AED',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    gap: 6,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  followButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  followingButtonText: {
    color: '#7C3AED',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    gap: 6,
  },
  messageButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    marginTop: SPACING.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#7C3AED',
  },
  tabText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#7C3AED',
  },
  loadingContainer: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: SPACING.xl * 3,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    color: '#4B5563',
    marginTop: SPACING.xs,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    position: 'relative',
    backgroundColor: '#1F2937',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  videoIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  multipleIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  // Menu Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: SPACING.md,
  },
  menuContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    minWidth: 200,
    paddingVertical: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  menuText: {
    fontSize: FONT_SIZE.md,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  logoutText: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: SPACING.xs,
  },
});

export default ProfileScreen;
