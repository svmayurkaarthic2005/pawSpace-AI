import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from './MapWrapper';
import Icon from 'react-native-vector-icons/Ionicons';

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
  tags?: string[];
  attendeeAvatars: string[];
}

interface EventMarkerProps {
  event: MapEvent;
  isSelected: boolean;
  onPress: () => void;
}

const EVENT_TYPE_COLORS = {
  meetup: '#7C3AED',
  training: '#378ADD',
  vet: '#EF4444',
  social: '#1D9E75',
};

const getEventType = (event: MapEvent): keyof typeof EVENT_TYPE_COLORS => {
  const tags = event.tags?.map((t) => t.toLowerCase()) ?? [];
  if (tags.includes('training')) return 'training';
  if (tags.includes('vet') || tags.includes('veterinary')) return 'vet';
  if (tags.includes('social') || tags.includes('party')) return 'social';
  return 'meetup';
};

const EventMarker: React.FC<EventMarkerProps> = ({ event, isSelected, onPress }) => {
  const eventType = getEventType(event);
  const color = EVENT_TYPE_COLORS[eventType];

  const iconName =
    eventType === 'meetup'
      ? 'paw'
      : eventType === 'training'
      ? 'barbell'
      : eventType === 'vet'
      ? 'fitness'
      : 'star';

  return (
    <Marker
      coordinate={{
        latitude: event.location.coordinates[1],
        longitude: event.location.coordinates[0],
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.markerContainer}>
        {isSelected && <View style={[styles.selectedRing, { borderColor: color }]} />}
        <View style={[styles.markerCircle, isSelected && styles.markerCircleSelected]}>
          <View style={[styles.iconBg, { backgroundColor: color + '22' }]}>
            <Icon name={iconName} color={color} size={18} />
          </View>
        </View>
        <View style={[styles.pointer, { borderTopColor: '#fff' }]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  selectedRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    top: -6,
    left: -6,
  },
  markerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    transform: [{ scale: 1 }],
  },
  markerCircleSelected: {
    transform: [{ scale: 1.3 }],
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});

export default EventMarker;
