import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from './MapWrapper';
import FastImage from 'react-native-fast-image';

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

interface UserMarkerProps {
  user: MapUser;
  isSelected: boolean;
  onPress: () => void;
}

const UserMarker: React.FC<UserMarkerProps> = ({ user, isSelected, onPress }) => {
  return (
    <Marker
      coordinate={{
        latitude: user.location.coordinates[1],
        longitude: user.location.coordinates[0],
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.ring, isSelected && styles.ringSelected]}>
          <FastImage
            source={{ uri: user.firstPet?.image || user.avatar }}
            style={[styles.avatar, isSelected && styles.avatarSelected]}
          />
        </View>
        <View style={[styles.pointer, { borderTopColor: '#7C3AED' }]} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  ring: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#7C3AED',
    backgroundColor: '#0D0D1A',
    overflow: 'hidden',
  },
  ringSelected: {
    borderColor: '#A78BFA',
    borderWidth: 3.5,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
  },
  avatarSelected: {
    width: 49,
    height: 49,
    borderRadius: 25,
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

export default UserMarker;
