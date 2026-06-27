import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Animated,
  Share,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../services/api';
import { formatCount, timeAgo } from '../../utils';
import { ExploreStackParamList } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommunityRule {
  title: string;
  description?: string;
}

interface CommunityDetailData {
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
  isMember: boolean;
  isAdmin: boolean;
  rules: CommunityRule[];
}

interface PostAuthor {
  _id: string;
  username: string;
  name?: string;
  avatar?: string;
}

interface CommunityPostItem {
  _id: string;
  content: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  media?: { url: string; type: 'image' | 'video' }[];
  createdAt: string;
}

interface PostsPage {
  posts: CommunityPostItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface MemberItem {
  user: {
    _id: string;
    username: string;
    name?: string;
    avatar?: string;
    bio?: string;
  };
  role: 'member' | 'moderator' | 'admin';
  joinedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 200;

const COLORS = {
  bg: '#0D0D1A',
  card: '#1A1A2E',
  primary: '#7C3AED',
  primarySurface: 'rgba(124,58,237,0.15)',
  primaryGlow: 'rgba(124,58,237,0.3)',
  text: '#FFFFFF',
  subtext: '#9CA3AF',
  border: 'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(0,0,0,0.55)',
  shimmerBase: '#1E1E35',
  shimmerHighlight: '#2D2D4E',
  success: '#10B981',
};

type Tab = 'posts' | 'members' | 'rules';

type RouteParams = RouteProp<ExploreStackParamList, 'CommunityDetail'>;
type NavProp = NativeStackNavigationProp<ExploreStackParamList, 'CommunityDetail'>;

// ─── Skeleton Component ───────────────────────────────────────────────────────

const SkeletonPulse: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}> = ({ width, height, borderRadius = 8, style }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: COLORS.shimmerBase,
          opacity,
        },
        style,
      ]}
    />
  );
};

const CommunityDetailSkeleton: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
    {/* Cover placeholder */}
    <SkeletonPulse width={SCREEN_WIDTH} height={COVER_HEIGHT} borderRadius={0} />
    {/* Info card */}
    <View style={{ padding: 16, gap: 12 }}>
      <SkeletonPulse width="60%" height={26} />
      <SkeletonPulse width="40%" height={18} />
      <SkeletonPulse width="100%" height={14} />
      <SkeletonPulse width="80%" height={14} />
      <SkeletonPulse width={120} height={40} borderRadius={20} />
    </View>
  </View>
);

// ─── Post Card ────────────────────────────────────────────────────────────────

const PostCard: React.FC<{
  post: CommunityPostItem;
  onPress: () => void;
}> = React.memo(({ post, onPress }) => (
  <TouchableOpacity
    style={styles.postCard}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {/* Author row */}
    <View style={styles.postAuthorRow}>
      {post.author?.avatar ? (
        <FastImage
          source={{ uri: post.author.avatar, priority: FastImage.priority.normal }}
          style={styles.postAvatar}
        />
      ) : (
        <View style={[styles.postAvatar, styles.postAvatarFallback]}>
          <Text style={styles.postAvatarLetter}>
            {(post.author?.username ?? '?')[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.postUsername} numberOfLines={1}>
          {post.author?.name || post.author?.username || 'Unknown'}
        </Text>
        <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
      </View>
    </View>
    {/* Content */}
    <Text style={styles.postContent} numberOfLines={3}>
      {post.content}
    </Text>
    {/* Media thumbnail */}
    {post.media && post.media.length > 0 && (
      <FastImage
        source={{ uri: post.media[0].url, priority: FastImage.priority.normal }}
        style={styles.postMediaThumb}
        resizeMode={FastImage.resizeMode.cover}
      />
    )}
    {/* Footer */}
    <View style={styles.postFooter}>
      <View style={styles.postStat}>
        <Icon name="heart-outline" size={15} color={COLORS.subtext} />
        <Text style={styles.postStatText}>{formatCount(post.likesCount)}</Text>
      </View>
      <View style={styles.postStat}>
        <Icon name="chatbubble-outline" size={15} color={COLORS.subtext} />
        <Text style={styles.postStatText}>{formatCount(post.commentsCount)}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

// ─── Member Row ───────────────────────────────────────────────────────────────

const MemberRow: React.FC<{ member: MemberItem }> = React.memo(({ member }) => (
  <View style={styles.memberRow}>
    {member.user?.avatar ? (
      <FastImage
        source={{ uri: member.user.avatar, priority: FastImage.priority.low }}
        style={styles.memberAvatar}
      />
    ) : (
      <View style={[styles.memberAvatar, styles.memberAvatarFallback]}>
        <Text style={styles.memberAvatarLetter}>
          {(member.user?.username ?? '?')[0].toUpperCase()}
        </Text>
      </View>
    )}
    <View style={{ flex: 1 }}>
      <Text style={styles.memberName} numberOfLines={1}>
        {member.user?.name || member.user?.username}
      </Text>
      <Text style={styles.memberUsername} numberOfLines={1}>
        @{member.user?.username}
      </Text>
    </View>
    {(member.role === 'admin' || member.role === 'moderator') && (
      <View
        style={[
          styles.roleBadge,
          member.role === 'admin' && { backgroundColor: COLORS.primarySurface },
        ]}
      >
        <Text
          style={[
            styles.roleBadgeText,
            member.role === 'admin' && { color: COLORS.primary },
          ]}
        >
          {member.role === 'admin' ? '★ Admin' : 'Mod'}
        </Text>
      </View>
    )}
  </View>
));

// ─── Rule Card ────────────────────────────────────────────────────────────────

const RuleCard: React.FC<{ rule: CommunityRule; index: number }> = React.memo(
  ({ rule, index }) => (
    <View style={styles.ruleCard}>
      <View style={styles.ruleNumber}>
        <Text style={styles.ruleNumberText}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ruleTitle}>{rule.title}</Text>
        {rule.description ? (
          <Text style={styles.ruleDescription}>{rule.description}</Text>
        ) : null}
      </View>
    </View>
  ),
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CommunityDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteParams>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { communityId } = (route.params ?? {}) as { communityId: string };

  // ─── State ────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [descExpanded, setDescExpanded] = useState(false);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  const TAB_LABELS: Tab[] = ['posts', 'members', 'rules'];
  const TAB_WIDTH = SCREEN_WIDTH / 3;

  // ─── Switch Tab ───────────────────────────────────────────────────────────

  const switchTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      const idx = TAB_LABELS.indexOf(tab);
      Animated.spring(tabIndicatorAnim, {
        toValue: idx,
        useNativeDriver: false,
        tension: 80,
        friction: 10,
      }).start();
    },
    [tabIndicatorAnim],
  );

  const tabIndicatorLeft = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2],
  });

  // ─── Fetch Community Detail ───────────────────────────────────────────────

  const {
    data: community,
    isLoading,
    isError,
    refetch,
  } = useQuery<CommunityDetailData>({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}`);
      // Handle both { data: Community } and { data: { community: ... } } shapes
      const raw = res.data.data;
      if (raw?.community) {
        return {
          ...raw.community,
          isMember: raw.isMember ?? raw.community.isMember ?? false,
          isAdmin: raw.isAdmin ?? raw.community.isAdmin ?? false,
          memberCount: raw.memberCount ?? raw.community.memberCount ?? 0,
          rules: raw.community.rules ?? [],
        } as CommunityDetailData;
      }
      return { ...raw, rules: raw.rules ?? [] } as CommunityDetailData;
    },
    staleTime: 60_000,
    enabled: !!communityId,
  });

  // ─── Fetch Posts (Infinite) ───────────────────────────────────────────────

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: postsLoading,
  } = useInfiniteQuery<PostsPage>({
    queryKey: ['communityPosts', communityId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = { limit: 15 };
      if (pageParam) params.cursor = pageParam;
      const res = await api.get(`/communities/${communityId}/posts`, { params });
      const d = res.data.data;
      return {
        posts: d.posts ?? d ?? [],
        nextCursor: d.nextCursor ?? null,
        hasMore: d.hasMore ?? false,
      } as PostsPage;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!communityId,
    staleTime: 30_000,
    initialPageParam: undefined,
  });

  const posts = useMemo(
    () => postsData?.pages.flatMap((p) => p.posts) ?? [],
    [postsData],
  );

  // ─── Fetch Members ────────────────────────────────────────────────────────

  const { data: members = [], isLoading: membersLoading } = useQuery<MemberItem[]>({
    queryKey: ['communityMembers', communityId],
    queryFn: async () => {
      const res = await api.get(`/communities/${communityId}/members`);
      return (res.data.data ?? []) as MemberItem[];
    },
    enabled: activeTab === 'members' && !!communityId,
    staleTime: 120_000,
  });

  // ─── Join Mutation ────────────────────────────────────────────────────────

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/communities/${communityId}/join`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['community', communityId] });
      const prev = queryClient.getQueryData<CommunityDetailData>(['community', communityId]);
      queryClient.setQueryData<CommunityDetailData>(['community', communityId], (old: CommunityDetailData | undefined) =>
        old ? { ...old, isMember: true, memberCount: old.memberCount + 1 } : old,
      );
      return { prev };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      void queryClient.invalidateQueries({ queryKey: ['myCommunities'] });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['community', communityId], ctx.prev);
      }
      Alert.alert('Error', 'Failed to join community. Please try again.');
    },
  });

  // ─── Leave Mutation ───────────────────────────────────────────────────────

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/communities/${communityId}/leave`),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['community', communityId] });
      const prev = queryClient.getQueryData<CommunityDetailData>(['community', communityId]);
      queryClient.setQueryData<CommunityDetailData>(['community', communityId], (old: CommunityDetailData | undefined) =>
        old
          ? { ...old, isMember: false, memberCount: Math.max(0, old.memberCount - 1) }
          : old,
      );
      return { prev };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      void queryClient.invalidateQueries({ queryKey: ['myCommunities'] });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['community', communityId], ctx.prev);
      }
      Alert.alert('Error', 'Failed to leave community. Please try again.');
    },
  });

  const handleLeave = useCallback(() => {
    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave "${community?.name ?? 'this community'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveMutation.mutate(),
        },
      ],
    );
  }, [community?.name, leaveMutation]);

  const handleShare = useCallback(async () => {
    await Share.share({
      message: `${community?.name ?? 'Community'}: ${community?.description ?? ''}`,
    });
  }, [community]);

  // ─── Loading / Error states ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <StatusBar barStyle="light-content" />
        {/* Overlay back button while loading */}
        <TouchableOpacity
          style={[styles.overlayBtn, { top: insets.top + 12, left: 16 }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <CommunityDetailSkeleton />
      </View>
    );
  }

  if (isError || !community) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <Icon name="alert-circle-outline" size={56} color={COLORS.subtext} />
        <Text style={styles.errorTitle}>Community not found</Text>
        <Text style={styles.errorSub}>
          This community may have been removed or made private.
        </Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBtnText}>Go back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMutating = joinMutation.isPending || leaveMutation.isPending;

  // ─── Tab Content ──────────────────────────────────────────────────────────

  const renderPostsTab = () => {
    if (postsLoading) {
      return (
        <ActivityIndicator
          color={COLORS.primary}
          size="large"
          style={{ marginTop: 40 }}
        />
      );
    }
    if (posts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySub}>
            {community.isMember
              ? 'Be the first to post in this community!'
              : 'Join to see and create posts.'}
          </Text>
        </View>
      );
    }
    return (
      <FlashList
        data={posts}
        keyExtractor={(item) => item._id}
        estimatedItemSize={140}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => (navigation as any).navigate('PostDetail', { postId: item._id })}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={COLORS.primary} style={{ paddingVertical: 20 }} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEnabled={false}
      />
    );
  };

  const renderMembersTab = () => {
    if (membersLoading) {
      return (
        <ActivityIndicator
          color={COLORS.primary}
          size="large"
          style={{ marginTop: 40 }}
        />
      );
    }
    if (members.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>
            {formatCount(community.memberCount)} members
          </Text>
          <Text style={styles.emptySub}>Member list is not available yet.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={members}
        keyExtractor={(item) => item.user._id}
        renderItem={({ item }) => <MemberRow member={item} />}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderRulesTab = () => {
    const rules = community.rules ?? [];
    if (rules.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No rules set</Text>
          <Text style={styles.emptySub}>
            This community hasn't established any rules yet.
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={rules}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item, index }) => <RuleCard rule={item} index={index} />}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Absolute overlay buttons (back / share) ── */}
      <TouchableOpacity
        style={[styles.overlayBtn, { top: insets.top + 12, left: 16 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.overlayBtn, { top: insets.top + 12, right: 16 }]}
        onPress={() => void handleShare()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="share-social" size={20} color="#fff" />
      </TouchableOpacity>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Cover Image ── */}
        <View style={styles.coverWrapper}>
          {community.coverImage ? (
            <FastImage
              source={{ uri: community.coverImage, priority: FastImage.priority.high }}
              style={styles.coverImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.coverGradient}>
              <View style={styles.coverGradientInner} />
            </View>
          )}
          {/* Dark gradient overlay for readability */}
          <View style={styles.coverOverlay} />

          {/* ── Community Avatar (overlapping bottom of cover) ── */}
          <View style={styles.avatarWrapper}>
            {community.avatar ? (
              <FastImage
                source={{ uri: community.avatar, priority: FastImage.priority.high }}
                style={styles.communityAvatar}
              />
            ) : (
              <View style={[styles.communityAvatar, styles.communityAvatarFallback]}>
                <Text style={styles.communityAvatarEmoji}>🐾</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Community Info Card ── */}
        <View style={styles.infoCard}>
          {/* Name + private badge */}
          <View style={styles.nameRow}>
            <Text style={styles.communityName} numberOfLines={2}>
              {community.name}
            </Text>
            {community.isPrivate && (
              <View style={styles.privateBadge}>
                <Icon name="lock-closed" size={11} color={COLORS.subtext} />
                <Text style={styles.privateBadgeText}>Private</Text>
              </View>
            )}
          </View>

          {/* Species pills */}
          {community.species?.length > 0 && (
            <View style={styles.pillsRow}>
              {community.species.map((s: string) => (
                <View key={s} style={styles.speciesPill}>
                  <Text style={styles.speciesPillText}>{s}</Text>
                </View>
              ))}
              {(community.tags ?? []).slice(0, 2).map((t: string) => (
                <View key={t} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description (expandable) */}
          {community.description ? (
            <TouchableOpacity
              onPress={() => setDescExpanded((e) => !e)}
              activeOpacity={0.85}
            >
              <Text
                style={styles.description}
                numberOfLines={descExpanded ? undefined : 3}
              >
                {community.description}
              </Text>
              {community.description.length > 120 && (
                <Text style={styles.readMore}>
                  {descExpanded ? 'Show less' : 'Read more'}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="people" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatCount(community.memberCount)}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="document-text" size={16} color={COLORS.primary} />
              <Text style={styles.statValue}>{formatCount(community.postCount)}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Join / Leave / Admin button */}
          <View style={styles.actionRow}>
            {community.isAdmin ? (
              <View style={styles.adminBadgeBtn}>
                <Icon name="shield-checkmark" size={16} color={COLORS.primary} />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            ) : community.isMember ? (
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={handleLeave}
                disabled={isMutating}
                activeOpacity={0.8}
              >
                {isMutating ? (
                  <ActivityIndicator color={COLORS.subtext} size="small" />
                ) : (
                  <>
                    <Icon name="exit-outline" size={16} color={COLORS.subtext} />
                    <Text style={styles.leaveBtnText}>Leave Community</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.joinBtn,
                  isMutating && { opacity: 0.6 },
                ]}
                onPress={() => joinMutation.mutate()}
                disabled={isMutating}
                activeOpacity={0.8}
              >
                {isMutating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="add-circle-outline" size={16} color="#fff" />
                    <Text style={styles.joinBtnText}>Join Community</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsRow}>
            {TAB_LABELS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.tabBtn}
                onPress={() => switchTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === tab && styles.tabBtnTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Animated indicator */}
          <View style={styles.tabIndicatorTrack}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { width: TAB_WIDTH - 32, left: tabIndicatorLeft },
                { marginLeft: 16 },
              ]}
            />
          </View>
        </View>

        {/* ── Tab Content ── */}
        <View style={styles.tabContent}>
          {activeTab === 'posts' && renderPostsTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'rules' && renderRulesTab()}
        </View>
      </ScrollView>

      {/* ── FAB (only if member) ── */}
      {community.isMember && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() =>
            (navigation as any).navigate('CreatePost', {
              communityId,
              defaultCommunityId: communityId,
            })
          }
          activeOpacity={0.8}
        >
          <Icon name="pencil" size={22} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },

  // ── Overlay buttons (back / share) ──
  overlayBtn: {
    position: 'absolute',
    zIndex: 50,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Cover ──
  coverWrapper: {
    height: COVER_HEIGHT,
    position: 'relative',
  },
  coverImage: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
  },
  coverGradient: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
    backgroundColor: '#1A1A2E',
  },
  coverGradientInner: {
    flex: 1,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -30,
    left: 20,
    zIndex: 10,
  },
  communityAvatar: {
    width: 62,
    height: 62,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: COLORS.primary,
  },
  communityAvatarFallback: {
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityAvatarEmoji: {
    fontSize: 28,
  },

  // ── Info card ──
  infoCard: {
    backgroundColor: COLORS.card,
    marginTop: 0,
    paddingTop: 46,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  communityName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    flexShrink: 1,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  privateBadgeText: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  speciesPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.primarySurface,
  },
  speciesPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tagPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  description: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 21,
  },
  readMore: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  leaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  leaveBtnText: {
    color: COLORS.subtext,
    fontSize: 14,
    fontWeight: '600',
  },
  adminBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.primarySurface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  adminBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Tabs ──
  tabsContainer: {
    backgroundColor: COLORS.card,
    marginTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.subtext,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
  },
  tabIndicatorTrack: {
    height: 2,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    bottom: 0,
  },
  tabContent: {
    minHeight: 300,
    backgroundColor: COLORS.bg,
    paddingTop: 8,
  },

  // ── Post card ──
  postCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postAvatarFallback: {
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarLetter: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  postUsername: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 1,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
  },
  postMediaThumb: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: COLORS.shimmerBase,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    color: COLORS.subtext,
    fontWeight: '600',
  },

  // ── Member row ──
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberAvatarFallback: {
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberUsername: {
    fontSize: 12,
    color: COLORS.subtext,
    marginTop: 1,
  },
  roleBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.subtext,
  },

  // ── Rule card ──
  ruleCard: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  ruleNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  ruleDescription: {
    fontSize: 13,
    color: COLORS.subtext,
    lineHeight: 19,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Error state ──
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  errorSub: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: 'center',
  },
  errorBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 8,
  },
  errorBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // ── FAB ──
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
});

export { CommunityDetailScreen };
export default CommunityDetailScreen;
