import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MapView, Polyline, PROVIDER_GOOGLE, mapModuleError, MapErrorFallback } from './MapWrapper';
import lightMapStyle from '../../constants/googleMapLightStyle.json';
import EventMarker from './EventMarker';
import UserMarker from './UserMarker';

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

interface SelectedMarker {
  type: 'event' | 'user';
  data: MapEvent | MapUser;
  coordinate: { latitude: number; longitude: number };
}

interface LocationState {
  granted: boolean;
  coords: { latitude: number; longitude: number } | null;
}

interface GoogleMapProps {
  location: LocationState;
  events: MapEvent[];
  users: MapUser[];
  selectedMarker: SelectedMarker | null;
  onSelectMarker: (marker: SelectedMarker) => void;
  onDeselectMarker: () => void;
  mapRef: React.RefObject<any>;
  routeCoordinates: Array<{ latitude: number; longitude: number }> | null;
  showRoute: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

const DEFAULT_REGION = {
  latitude: 13.0827,
  longitude: 80.2707,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const GoogleMap: React.FC<GoogleMapProps> = ({
  location,
  events,
  users,
  selectedMarker,
  onSelectMarker,
  onDeselectMarker,
  mapRef,
  routeCoordinates,
  showRoute,
  onZoomIn,
  onZoomOut,
}) => {
  // Show error fallback if maps module failed to load
  if (mapModuleError || !MapView) {
    return <MapErrorFallback error={mapModuleError || new Error('MapView not available')} />;
  }

  const initialRegion = location.coords
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : DEFAULT_REGION;

  const handleZoomIn = () => {
    if (mapRef.current && onZoomIn) {
      mapRef.current.getCamera().then((camera: any) => {
        mapRef.current.animateCamera({
          center: camera.center,
          zoom: (camera.zoom || 13) + 1,
        }, { duration: 300 });
      });
      onZoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current && onZoomOut) {
      mapRef.current.getCamera().then((camera: any) => {
        mapRef.current.animateCamera({
          center: camera.center,
          zoom: (camera.zoom || 13) - 1,
        }, { duration: 300 });
      });
      onZoomOut();
    }
  };

  return (
    <>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={lightMapStyle as any}
        initialRegion={initialRegion}
        showsUserLocation={location.granted}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled={false}
        zoomEnabled={true}
        zoomControlEnabled={false}
        onPress={() => {
          if (selectedMarker) onDeselectMarker();
        }}
      >
        {events.map((event) => (
          <EventMarker
            key={event._id}
            event={event}
            isSelected={selectedMarker?.type === 'event' && (selectedMarker.data as any)._id === event._id}
            onPress={() =>
              onSelectMarker({
                type: 'event',
                data: event,
                coordinate: {
                  latitude: event.location.coordinates[1],
                  longitude: event.location.coordinates[0],
                },
              })
            }
          />
        ))}

        {users.map((user) => (
          <UserMarker
            key={user.userId}
            user={user}
            isSelected={selectedMarker?.type === 'user' && (selectedMarker.data as MapUser).userId === user.userId}
            onPress={() =>
              onSelectMarker({
                type: 'user',
                data: user,
                coordinate: {
                  latitude: user.location.coordinates[1],
                  longitude: user.location.coordinates[0],
                },
              })
            }
          />
        ))}

        {showRoute && routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#7C3AED"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}>
          <Icon name="add" color="#333" size={20} />
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}>
          <Icon name="remove" color="#333" size={20} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 280,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 0.5,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default GoogleMap;
