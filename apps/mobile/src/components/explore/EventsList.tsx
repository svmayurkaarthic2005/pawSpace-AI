import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Event } from '../../types';

interface EventsListProps {
  events: Event[];
}

export const EventsList: React.FC<EventsListProps> = ({ events }) => {
  const navigation = useNavigation();

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetail' as never, { eventId } as never);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      horizontal={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {events.map((event) => (
        <TouchableOpacity
          key={event.id}
          style={styles.card}
          onPress={() => handleEventPress(event.id)}
          activeOpacity={0.8}
        >
          {/* Cover Image */}
          {event.coverImage && (
            <Image source={{ uri: event.coverImage }} style={styles.coverImage} resizeMode="cover" />
          )}

          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>

            {/* Date & Location */}
            <View style={styles.infoRow}>
              <Icon name="calendar-outline" size={14} color="#9CA3AF" />
              <Text style={styles.infoText}>{formatDate(event.startDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="location-outline" size={14} color="#9CA3AF" />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.location.name}
              </Text>
            </View>

            {/* Distance & RSVP */}
            <View style={styles.footer}>
              {event.distance !== undefined && (
                <View style={styles.distanceBadge}>
                  <Icon name="navigate-outline" size={12} color="#10B981" />
                  <Text style={styles.distanceText}>{event.distance.toFixed(1)}km</Text>
                </View>
              )}
              <View style={styles.rsvpBadge}>
                <Icon name="people-outline" size={12} color="#7C3AED" />
                <Text style={styles.rsvpText}>{event.rsvpCount} going</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  coverImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#0D0D1A',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  rsvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rsvpText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7C3AED',
    marginLeft: 4,
  },
});
