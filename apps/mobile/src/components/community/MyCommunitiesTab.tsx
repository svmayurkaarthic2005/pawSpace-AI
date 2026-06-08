import React from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { CommunityMembership } from '../../types';
import { CommunityRow } from './CommunityRow';
import { MyCommunitiesEmpty } from './MyCommunitiesEmpty';

interface MyCommunitiesTabProps {
  searchQuery: string;
  isSearchActive: boolean;
  onSwitchToDiscover: () => void;
}

export const MyCommunitiesTab: React.FC<MyCommunitiesTabProps> = ({
  searchQuery,
  isSearchActive,
  onSwitchToDiscover,
}) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-communities'],
    queryFn: async () => {
      const response = await api.get('/communities/mine');
      return response.data.data as CommunityMembership[];
    },
    staleTime: 60_000,
  });

  const communities = data ?? [];

  // Filter by search query if active
  const filtered = isSearchActive
    ? communities.filter((c: CommunityMembership) =>
        c.community.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : communities;

  return (
    <FlashList<CommunityMembership>
      data={filtered}
      keyExtractor={(item: CommunityMembership) => item.community.id}
      renderItem={({ item }: { item: CommunityMembership }) => <CommunityRow item={item} />}
      estimatedItemSize={76}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor="#7C3AED"
          colors={['#7C3AED']}
        />
      }
      ListEmptyComponent={<MyCommunitiesEmpty onDiscover={onSwitchToDiscover} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 80,
  },
});
