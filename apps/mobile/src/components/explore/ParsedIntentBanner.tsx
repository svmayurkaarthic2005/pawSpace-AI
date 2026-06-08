import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { SearchIntent } from '../../types';

interface ParsedIntentBannerProps {
  intent: SearchIntent;
  onAdjust?: () => void;
}

export const ParsedIntentBanner: React.FC<ParsedIntentBannerProps> = ({ intent }) => {
  const badges: { icon: string; label: string; color: string }[] = [];

  // Type badge
  const typeIcons: Record<string, string> = {
    event: 'calendar-outline',
    community: 'people-outline',
    user: 'person-outline',
    post: 'image-outline',
    mixed: 'search-outline',
  };
  badges.push({
    icon: typeIcons[intent.type] || 'search-outline',
    label: intent.type.charAt(0).toUpperCase() + intent.type.slice(1),
    color: '#7C3AED',
  });

  // Species badges
  intent.species.forEach((species) => {
    badges.push({
      icon: species === 'dog' ? 'paw-outline' : species === 'cat' ? 'paw-outline' : 'paw-outline',
      label: species.charAt(0).toUpperCase() + species.slice(1),
      color: '#EC4899',
    });
  });

  // Location badge
  if (intent.location) {
    badges.push({
      icon: 'location-outline',
      label: intent.location,
      color: '#10B981',
    });
  } else if (intent.radius < 50) {
    badges.push({
      icon: 'navigate-circle-outline',
      label: `Within ${intent.radius}km`,
      color: '#10B981',
    });
  }

  // Date range badge
  if (intent.dateRange) {
    badges.push({
      icon: 'time-outline',
      label: intent.dateRange.label,
      color: '#F59E0B',
    });
  }

  // Keywords badges (max 3)
  intent.keywords.slice(0, 3).forEach((keyword) => {
    badges.push({
      icon: 'pricetag-outline',
      label: keyword,
      color: '#6B7280',
    });
  });

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <Icon name="sparkles" size={16} color="#7C3AED" />
        <Text style={styles.headerText}>AI understood your search</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesContainer}
      >
        {badges.map((badge, index) => (
          <View
            key={`${badge.label}-${index}`}
            style={[styles.badge, { borderColor: badge.color }]}
          >
            <Icon name={badge.icon} size={14} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  badgesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
});
