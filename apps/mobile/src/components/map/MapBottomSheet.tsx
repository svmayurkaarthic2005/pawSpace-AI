import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import NearbyEventsList from './NearbyEventsList';
import NearbyOwnersList from './NearbyOwnersList';

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

interface MapUser {
  userId: string;
  username: string;
  name: string;
  avatar: string;
  distanceKm: number;
  location: {
    coordinates: [number, number];
  };
  firstPet: {
    name: string;
    breed: string;
    species: string;
    image: string;
  } | null;
}

interface MapBottomSheetProps {
  activeTab: 'events' | 'owners';
  onTabChange: (tab: 'events' | 'owners') => void;
  events: MapEvent[];
  users: MapUser[];
  isLoadingEvents: boolean;
  isLoadingUsers: boolean;
  onEventPress: (event: MapEvent) => void;
  onUserSayHi: (user: MapUser) => void;
  onEventMarkerFocus: (event: MapEvent) => void;
}

const MapBottomSheet: React.FC<MapBottomSheetProps> = ({
  activeTab,
  onTabChange,
  events,
  users,
  isLoadingEvents,
  isLoadingUsers,
  onEventPress,
  onUserSayHi,
  onEventMarkerFocus,
}) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabBar}>
        {(['events', 'owners'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => onTabChange(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'events' ? 'Nearby events' : 'Pet owners'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'events' ? (
        <NearbyEventsList
          events={events}
          isLoading={isLoadingEvents}
          onPress={onEventPress}
          onFocusMarker={onEventMarkerFocus}
        />
      ) : (
        <NearbyOwnersList users={users} isLoading={isLoadingUsers} onSayHi={onUserSayHi} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -0.5,
  },
  tabActive: {
    borderBottomColor: '#7C3AED',
  },
  tabLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default MapBottomSheet;
