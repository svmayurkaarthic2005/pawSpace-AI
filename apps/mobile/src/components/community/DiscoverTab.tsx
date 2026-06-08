import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Community, DiscoverCommunitiesResponse } from '../../types';
import { SpeciesFilterBar } from './SpeciesFilterBar';
import { AIRecommendedGrid } from './AIRecommendedGrid';
import { CommunitiesGrid } from './CommunitiesGrid';
import { SectionHeader } from './SectionHeader';
import { capitalize } from '../../utils/format';

interface DiscoverTabProps {
  speciesFilter: string;
  onSpeciesChange: (species: string) => void;
  searchQuery: string;
  isSearchActive: boolean;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  speciesFilter,
  onSpeciesChange,
  searchQuery,
  isSearchActive,
}) => {
  const { data: discoverData, isLoading } = useQuery({
    queryKey: ['communities-discover', speciesFilter],
    queryFn: async () => {
      const params = speciesFilter === 'all' ? {} : { species: speciesFilter };
      const response = await api.get('/communities/discover', { params });
      return response.data.data as DiscoverCommunitiesResponse;
    },
    staleTime: 300_000,
  });

  const { data: recommendedData, isLoading: isLoadingRec } = useQuery({
    queryKey: ['communities-recommended'],
    queryFn: async () => {
      const response = await api.get('/communities/recommended');
      return response.data.data as Community[];
    },
    staleTime: 3600_000,
    enabled: speciesFilter === 'all' && !isSearchActive,
  });

  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['communities-search', searchQuery],
    queryFn: async () => {
      const response = await api.get('/communities/search', { params: { q: searchQuery } });
      return response.data.data as Community[];
    },
    enabled: isSearchActive && searchQuery.length > 0,
    staleTime: 30_000,
  });

  // Show search results if active
  if (isSearchActive) {
    if (isLoadingSearch) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SectionHeader title={`Search: "${searchQuery}"`} />
        <CommunitiesGrid communities={searchData ?? []} isLoading={false} />
      </ScrollView>
    );
  }

  // Normal discover content
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* AI Recommended section - only when no species filter */}
      {speciesFilter === 'all' && (
        <>
          <SectionHeader title="Recommended for you" aiLabel="✦ AI picks" />
          <AIRecommendedGrid communities={recommendedData ?? []} isLoading={isLoadingRec} />
        </>
      )}

      {/* Species filter */}
      <SpeciesFilterBar activeSpecies={speciesFilter} onChange={onSpeciesChange} />

      {/* Browse by species / all */}
      <SectionHeader
        title={speciesFilter === 'all' ? 'Browse all' : `${capitalize(speciesFilter)} communities`}
      />
      <CommunitiesGrid
        communities={discoverData?.allCommunities ?? []}
        isLoading={isLoading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
});
