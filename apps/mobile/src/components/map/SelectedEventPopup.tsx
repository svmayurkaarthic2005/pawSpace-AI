import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
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

interface SelectedEventPopupProps {
  event: MapEvent;
  onClose: () => void;
  onViewDetails: () => void;
  onGetDirections: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOTTOM_SHEET_HALF_HEIGHT = 200;

const SelectedEventPopup: React.FC<SelectedEventPopupProps> = ({
  event,
  onClose,
  onViewDetails,
  onGetDirections,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, { damping: 15 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.popup, animStyle]}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Icon name="close" color="rgba(255,255,255,0.5)" size={16} />
      </TouchableOpacity>

      <View style={styles.contentRow}>
        <FastImage source={{ uri: event.coverImage }} style={styles.coverImage} />
        <View style={styles.info}>
          <Text style={styles.eventName} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.eventDate}>{formatEventDate(event.startDate)}</Text>
          <View style={styles.distanceBadge}>
            <Icon name="location" size={10} color="#A78BFA" />
            <Text style={styles.distanceText}>{formatDistance(event.distanceKm)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.attendeesRow}>
        <View style={styles.avatarStack}>
          {event.attendeeAvatars.slice(0, 3).map((av, i) => (
            <FastImage
              key={i}
              source={{ uri: av }}
              style={[styles.attendeeAvatar, { marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }]}
            />
          ))}
        </View>
        <Text style={styles.attendeeCount}>
          {event.rsvpCount > 3 ? `+${event.rsvpCount - 3} going` : `${event.rsvpCount} going`}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.directionsBtn} onPress={onGetDirections}>
          <Icon name="navigate" color="#A78BFA" size={14} />
          <Text style={styles.directionsBtnText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailsBtn} onPress={onViewDetails}>
          <Text style={styles.detailsBtnText}>View details</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    bottom: BOTTOM_SHEET_HALF_HEIGHT + 16,
    left: (SCREEN_WIDTH - 260) / 2,
    width: 260,
    backgroundColor: 'rgba(13,13,26,0.95)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    zIndex: 50,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  coverImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eventName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
  },
  eventDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 10,
    color: '#A78BFA',
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  attendeeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(13,13,26,0.95)',
  },
  attendeeCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(124,58,237,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  directionsBtnText: {
    fontSize: 12,
    color: '#A78BFA',
  },
  detailsBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingVertical: 7,
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
});

export default SelectedEventPopup;
