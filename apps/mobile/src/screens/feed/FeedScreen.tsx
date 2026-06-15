import React, { useCallback } from 'react';
import {
  View, StyleSheet, ActivityIndicator, StatusBar, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { postApi } from '../../services/post.service';
import PostCard from '../../components/feed/PostCard';
import FeedHeader from '../../components/feed/FeedHeader';
import EmptyFeed from '../../components/feed/EmptyFeed';
import { QUERY_KEYS } from '../../constants';

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.FEED,
    queryFn: ({ pageParam }) => postApi.getFeed(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 120000, // 2 minutes
  });

  const posts = data?.pages.flatMap((p) => p.items).filter(Boolean) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (!item || !item._id) return null;
      return <PostCard post={item} />;
    },
    []
  );

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const ListFooter = isFetchingNextPage ? (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color="#7C3AED" />
    </View>
  ) : null;

  const ListEmpty = isLoading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  ) : (
    <EmptyFeed />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FeedHeader />
      </SafeAreaView>
      
      <FlashList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?._id || `post-${index}`}
        estimatedItemSize={520}
        drawDistance={500}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7C3AED"
            colors={['#7C3AED']}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* AI Pet Assistant FAB */}
      <TouchableOpacity
        style={styles.aiFab}
        onPress={() => navigation.navigate('PetAssistant')}
        activeOpacity={0.8}
      >
        <Icon name="sparkles" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  safeArea: {
    backgroundColor: '#0D0D1A',
  },
  listContent: {
    paddingBottom: 80, // Extra padding for tab bar
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  aiFab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default FeedScreen;
