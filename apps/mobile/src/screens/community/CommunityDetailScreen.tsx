import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../services/api';
import { socketService } from '../../services/socket.service';
import { CommunityDetailResponse, CommunityPost, CommunityDetail } from '../../types';
import { CommunityDetailHeader } from '../../components/community/CommunityDetailHeader';
import { PinnedPostWrapper } from '../../components/community/PinnedPostWrapper';
import { CommunityPostCard } from '../../components/community/CommunityPostCard';
import { CommunityEmptyFeed } from '../../components/community/CommunityEmptyFeed';

type RouteParams = {
  CommunityDetail: {
    communityId: string;
    community?: any;
  };
};

const COVER_HEIGHT = 220;
const HEADER_HEIGHT = 88;

export const CommunityDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RouteParams, 'CommunityDetail'>>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  
  const { communityId, community: initialCommunity } = route.params;

  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Navbar animations
  const navBgOpacity = scrollY.interpolate({
    inputRange: [COVER_HEIGHT - HEADER_HEIGHT, COVER_HEIGHT - HEADER_HEIGHT + 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const navTitleOpacity = scrollY.interpolate({
    inputRange: [COVER_HEIGHT - 60, COVER_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const coverParallax = scrollY.interpolate({
    inputRange: [-COVER_HEIGHT, 0, COVER_HEIGHT],
    outputRange: [COVER_HEIGHT / 2, 0, -COVER_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  // Fetch community data
  const { data: communityData } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const response = await api.get(`/communities/${communityId}`);
      return response.data.data as CommunityDetailResponse;
    },
    initialData: initialCommunity
      ? { community: initialCommunity, isMember: false, isAdmin: false, pinnedPost: null, memberCount: initialCommunity.memberCount || 0 }
      : undefined,
    staleTime: 60_000,
  });

  // Fetch community posts
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['community-posts', communityId],
    queryFn: async ({ pageParam }) => {
      const params: any = { limit: 10 };
      if (pageParam) params.cursor = pageParam;
      
      const response = await api.get(`/communities/${communityId}/posts`, { params });
      return response.data.data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!communityId,
    staleTime: 30_000,
    initialPageParam: undefined,
  });

  const posts = postsData?.pages.flatMap((p) => p.posts) ?? [];
  const communityDetail = communityData?.community as CommunityDetail;

  // Update local state from server data
  useEffect(() => {
    if (communityData) {
      setIsMember(communityData.isMember);
      setIsAdmin(communityData.isAdmin);
      setMemberCount(communityData.memberCount || communityData.community.memberCount || 0);
    }
  }, [communityData]);

  // Mark community as read on mount
  useEffect(() => {
    if (isMember && communityId) {
      api.post(`/communities/${communityId}/read`).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['my-communities'] });
    }
  }, [communityId, isMember, queryClient]);

  // Socket integration for real-time updates
  useEffect(() => {
    if (!socketService.isConnected()) return;
    
    const socket = socketService as any;

    socket.emit('community:join', communityId);

    const handleNewPost = (data: { post: CommunityPost; communityId: string }) => {
      if (data.communityId === communityId) {
        queryClient.invalidateQueries({ queryKey: ['community-posts', communityId] });
      }
    };

    socket.on('community:new_post', handleNewPost);

    return () => {
      socket.emit('community:leave', communityId);
      socket.off('community:new_post', handleNewPost);
    };
  }, [communityId, queryClient]);

  const handleCreatePost = () => {
    (navigation as any).navigate('CreatePost', {
      communityId,
      defaultCommunityId: communityId,
    });
  };

  const handleMemberCountUpdate = (delta: number) => {
    setMemberCount((prev) => Math.max(0, prev + delta));
  };

  const renderPost = ({ item }: { item: CommunityPost }) => {
    if (item.isPinned) {
      return (
        <PinnedPostWrapper post={item} isAdmin={isAdmin} communityId={communityId} />
      );
    }
    return <CommunityPostCard post={item} isAdmin={isAdmin} communityId={communityId} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating navbar */}
      <Animated.View
        style={[
          styles.navbar,
          {
            backgroundColor: navBgOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(13, 13, 26, 0)', 'rgba(13, 13, 26, 0.95)'],
            }),
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-left" color="#fff" size={22} />
        </TouchableOpacity>
        <Animated.Text
          style={[styles.navTitle, { opacity: navTitleOpacity }]}
          numberOfLines={1}
        >
          {communityDetail?.name}
        </Animated.Text>
        <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
          <Icon name="share" color="#fff" size={20} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.FlatList
        data={posts.filter((p) => !p.isPinned)} // Filter out pinned post as it's shown in header
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <CommunityDetailHeader
            community={communityDetail}
            isMember={isMember}
            isAdmin={isAdmin}
            coverParallax={coverParallax}
            onMemberCountUpdate={handleMemberCountUpdate}
            onMembershipChange={setIsMember}
          />
        }
        ListEmptyComponent={
          <CommunityEmptyFeed isMember={isMember} onCreatePost={handleCreatePost} />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color="#7C3AED" style={{ padding: 20 }} />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create post FAB */}
      {isMember && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreatePost}
          activeOpacity={0.8}
        >
          <Icon name="plus" color="#fff" size={24} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 44,
    zIndex: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
