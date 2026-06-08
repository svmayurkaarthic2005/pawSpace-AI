import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Community } from '../../types';
import { CommunityCard } from './CommunityCard';

interface AIRecommendedGridProps {
  communities: Community[];
  isLoading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const COL_WIDTH = (screenWidth - 48) / 2;

export const AIRecommendedGrid: React.FC<AIRecommendedGridProps> = ({
  communities,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <View style={styles.grid}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.skeleton, { width: COL_WIDTH, height: 180 }]} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {communities.slice(0, 6).map((community) => (
        <CommunityCard key={community.id} community={community} showAIBadge />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
});
