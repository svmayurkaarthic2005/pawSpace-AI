import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { formatEventDate } from '../../utils/formatEventDate';
import { formatDistance } from '../../utils/formatDistance';

interface MapEvent {
  _id: string;
  title: string;
  coverImage: string;
  location: {
    coordinates: [number, number];
  };
  startDate: string;
  distanceKm: number;
  rsvpCount: number;
  pet_friendly_species: string[];
  attendeeAvatars: string[];
}

interface NearbyEventsListProps {
  events: MapEvent[];
  isLoading: boolean;
  onPress: (event: MapEvent) => void;
  onFocusMarker: (event: MapEvent) => void;
}

const EmptyEventsState = () => (
  <View style={styles.emptyState}>
    <Icon name="calendar-outline" size={48} color="rgba(255,255,255,0.2)" />
    <Text style={styles.emptyTitle}>No events nearby</Text>
    <Text style={styles.emptySub}>Try adjusting your filters or search radius</Text>
  </View>
);

const NearbyEventsList: React.FC<NearbyEventsListProps> = ({ events, isLoading, onPress, onFocusMarker }) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <BottomSheetFlatList
      data={events}
      keyExtractor={(e) => e._id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.eventRow} onPress={() => onPress(item)}>
          <TouchableOpacity onPress={() => onFocusMarker(item)} style={styles.imageWrapper}>
            <FastImage source={{ uri: item.coverImage }} style={styles.eventImage} />
            {item.pet_friendly_species.slice(0, 1).map((s) => (
              <View key={s} style={styles.speciesBadge}>
                <Text style={styles.speciesBadgeText}>{s}</Text>
              </View>
            ))}
          </TouchableOpacity>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.eventMeta}>
              <Icon name="calendar-outline" size={12} color="rgba(255,255,255,0.4)" />
              <Text style={styles.eventMetaText}>{formatEventDate(item.startDate)}</Text>
            </View>
            <View style={styles.eventBottom}>
              <View style={styles.distancePill}>
                <Icon name="location" size={10} color="#A78BFA" />
                <Text style={styles.distancePillText}>{formatDistance(item.distanceKm)}</Text>
              </View>
              <Text style={styles.rsvpText}>{item.rsvpCount} going</Text>
            </View>
          </View>
          <Icon name="chevron-forward" color="rgba(255,255,255,0.2)" size={16} />
        </TouchableOpacity>
      )}
      ListEmptyComponent={<EmptyEventsState />}
      contentContainerStyle={{ paddingBottom: 24 }}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  imageWrapper: {
    position: 'relative',
  },
  eventImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  speciesBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'rgba(13,13,26,0.85)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  speciesBadgeText: {
    fontSize: 8,
    color: '#A78BFA',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 3,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  eventBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  distancePillText: {
    fontSize: 10,
    color: '#A78BFA',
  },
  rsvpText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
});

export default NearbyEventsList;
