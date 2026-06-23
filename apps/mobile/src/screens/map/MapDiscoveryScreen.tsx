import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Keyboard, Alert, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { MapView, mapModuleError, MapErrorFallback } from '../../components/map/MapWrapper';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import api from '../../services/api';
import useLocation from '../../hooks/useLocation';
import GoogleMap from '../../components/map/GoogleMap';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationPermissionModal from '../../components/map/LocationPermissionModal';
import LocationDeniedBanner from '../../components/map/LocationDeniedBanner';
import SelectedEventPopup from '../../components/map/SelectedEventPopup';
import SelectedUserPopup from '../../components/map/SelectedUserPopup';
import MapBottomSheet from '../../components/map/MapBottomSheet';
import FilterSheet from '../../components/map/FilterSheet';

interface MapFilters {
  species: string[];
  radiusKm: number;
  dateFilter: 'any' | 'today' | 'weekend' | 'week';
}

interface SelectedMarker {
  type: 'event' | 'user';
  data: any;
  coordinate: { latitude: number; longitude: number };
}

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const MapDiscoveryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const location = useLocation();

  const [filters, setFilters] = useState<MapFilters>({
    species: [],
    radiusKm: 25,
    dateFilter: 'any',
  });

  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);

  const [activeBottomTab, setActiveBottomTab] = useState<'events' | 'owners'>('events');
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }> | null>(
    null
  );
  const [showRoute, setShowRoute] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const mapRef = useRef<any>(null);

  // Log location state on mount and changes
  useEffect(() => {
    console.log('📍 MapDiscoveryScreen location state:', {
      granted: location.granted,
      coords: location.coords,
      denied: location.denied,
      blocked: location.blocked
    });
  }, [location.granted, location.coords, location.denied, location.blocked]);

  // Call getCurrentLocation explicitly on mount
  useEffect(() => {
    console.log('📍 MapDiscoveryScreen explicit location fetch on mount');
    location.getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only fetch location initially if we don't have it
    if (!location.coords && !location.granted) {
       location.getCurrentLocation();
    }
  }, []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheet>(null);

  const watchIdRef = useRef<number | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Start watching location on mount and cleanup properly
  useEffect(() => {
    isMountedRef.current = true;
    
    // Only start watch if granted and not already watching
    if (location.granted && watchIdRef.current === null) {
      console.log('🎯 MapDiscoveryScreen: Starting location watch...');
      const watchId = location.startWatching();
      watchIdRef.current = watchId;
      console.log('🎯 MapDiscoveryScreen: Watch ID stored:', watchId);
    }
    
    return () => {
      isMountedRef.current = false;
      
      // Cleanup watch on unmount
      if (watchIdRef.current !== null) {
        console.log('🛑 MapDiscoveryScreen: Clearing location watch:', watchIdRef.current);
        location.stopWatching(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [location.granted]); // Only depend on granted status

  // NOTE: Removed periodic location refresh interval - the watch already handles location updates
  // The watch updates location when user moves 50m or every 15s, which is sufficient

  console.log('🗺️ MapDiscoveryScreen render location:', location?.coords);

  // Fetch nearby events
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['map-events', location?.coords?.latitude, location?.coords?.longitude, filters],
    queryFn: () => {
      if (!location.coords) return { events: [] };
      
      const params: any = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        radius: filters.radiusKm,
        dateFilter: filters.dateFilter,
      };
      
      if (filters.species.length > 0) {
        params.species = filters.species.join(',');
      }
      
      console.log('🔍 Fetching events with params:', params);
      
      return api
        .get('/map/events', { params })
        .then((r) => r.data);
    },
    enabled: !!location?.coords?.latitude && !!location?.coords?.longitude,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Fetch nearby users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['map-users', location?.coords?.latitude, location?.coords?.longitude, filters],
    queryFn: () => {
      if (!location.coords) return { users: [] };
      
      const params: any = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        radius: filters.radiusKm,
      };
      
      if (filters.species.length > 0) {
        params.species = filters.species.join(',');
      }
      
      console.log('🔍 Fetching users with params:', params);
      
      return api
        .get('/map/users', { params })
        .then((r) => r.data);
    },
    enabled: !!location?.coords?.latitude && !!location?.coords?.longitude,
    staleTime: 60_000,
  });

  const events = eventsData?.events ?? [];
  const nearbyUsers = usersData?.users ?? [];



  const handleGetDirections = useCallback(async (event: any) => {
    if (!location.coords) {
      Alert.alert('Location Required', 'Enable location to get directions');
      return;
    }

    try {
      const res = await api.get('/map/directions', {
        params: {
          originLat: location.coords.latitude,
          originLng: location.coords.longitude,
          destLat: event.location.coordinates[1],
          destLng: event.location.coordinates[0],
          mode: 'walking',
        },
      });

      setRouteCoordinates(res.data.coordinates);
      setShowRoute(true);

      // Fit map to show both origin and destination
      mapRef.current?.fitToCoordinates(
        [
          { latitude: location.coords.latitude, longitude: location.coords.longitude },
          { latitude: event.location.coordinates[1], longitude: event.location.coordinates[0] },
        ],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );

      ReactNativeHapticFeedback.trigger('impactLight');
    } catch (error) {
      console.error('Get directions error:', error);
      Alert.alert('Error', 'Failed to get directions');
    }
  }, [location.coords]);

  const handleSayHi = useCallback(async (user: any) => {
    try {
      ReactNativeHapticFeedback.trigger('impactMedium');

      // Get or create chat
      const chatRes = await api.post('/chats', { userId: user.userId });
      const chatId = chatRes.data.chat._id;

      // Get AI icebreaker
      let aiIcebreaker = null;
      try {
        const icebreakerRes = await api.post('/ai/conversation-starters', {
          recipientId: user.userId,
        });
        aiIcebreaker = icebreakerRes.data.suggestions?.[0];
      } catch (err) {
        console.warn('AI icebreaker failed:', err);
      }

      navigation.navigate('ChatRoom', {
        chatId,
        recipientId: user.userId,
        recipientName: user.name,
        recipientAvatar: user.avatar,
        aiIcebreaker,
      });
    } catch (error) {
      console.error('Say hi error:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  }, [navigation]);

  const focusMapOnEvent = useCallback((event: any) => {
    mapRef.current?.animateToRegion(
      {
        latitude: event.location.coordinates[1] + 0.005,
        longitude: event.location.coordinates[0],
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      500
    );
    setSelectedMarker({
      type: 'event',
      data: event,
      coordinate: {
        latitude: event.location.coordinates[1],
        longitude: event.location.coordinates[0],
      },
    });
    bottomSheetRef.current?.snapToIndex(1);
    ReactNativeHapticFeedback.trigger('impactLight');
  }, []);

  const handleRecenterLocation = useCallback(() => {
    if (!location.coords) {
      location.getCurrentLocation();
      ReactNativeHapticFeedback.trigger('notificationWarning');
      Alert.alert('Location', 'Fetching your current location...');
      return;
    }

    setIsFollowingUser(true);
    mapRef.current?.getCamera().then((camera: any) => {
      mapRef.current.animateCamera(
        {
          center: { latitude: location.coords!.latitude, longitude: location.coords!.longitude },
          zoom: camera.zoom || 13,
        },
        { duration: 600 }
      );
    }).catch((err: any) => console.warn(err));
    ReactNativeHapticFeedback.trigger('impactLight');
  }, [location]);

  const handleZoomIn = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight');
  }, []);

  const handleZoomOut = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight');
  }, []);

  // Show error fallback if maps module failed to load
  if (mapModuleError || !MapView) {
    return <MapErrorFallback error={mapModuleError || new Error('MapView not available')} />;
  }

  return (
    <View style={styles.container}>
      <GoogleMap
        location={location}
        events={events}
        users={nearbyUsers}
        selectedMarker={selectedMarker}
        onSelectMarker={setSelectedMarker}
        onDeselectMarker={() => setSelectedMarker(null)}
        mapRef={mapRef}
        routeCoordinates={routeCoordinates}
        showRoute={showRoute}
        isFollowingUser={isFollowingUser}
        onUserInteraction={() => setIsFollowingUser(false)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {!location.granted && !location.denied && !location.blocked && (
        <LocationPermissionModal 
          onAllow={location.requestPermission} 
          onSkip={location.skipPermission}
        />
      )}

      {(location.denied || location.blocked) && (
        <LocationDeniedBanner 
          blocked={location.blocked} 
          onEnable={location.requestPermission}
        />
      )}

      {location.granted && !location.coords && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      )}

      <SafeAreaView style={styles.searchSafeArea} edges={['top']}>
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search for places..."
            fetchDetails={true}
            onPress={(data, details = null) => {
              Keyboard.dismiss();
              if (details?.geometry?.location) {
                mapRef.current?.animateToRegion(
                  {
                    latitude: details.geometry.location.lat,
                    longitude: details.geometry.location.lng,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  },
                  600
                );
              }
            }}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
              language: 'en',
            }}
            styles={{
              container: { flex: 1 },
              textInputContainer: {
                backgroundColor: 'rgba(13,13,26,0.92)',
                borderRadius: 16,
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.12)',
                paddingHorizontal: 6,
                height: 52,
                flexDirection: 'row',
                alignItems: 'center',
              },
              textInput: {
                backgroundColor: 'transparent',
                color: '#fff',
                fontSize: 15,
                height: 48,
                margin: 0,
                padding: 0,
              },
              listView: {
                backgroundColor: 'rgba(13,13,26,0.97)',
                borderRadius: 12,
                marginTop: 4,
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.1)',
                position: 'absolute',
                top: 56,
                left: 0,
                right: 0,
                zIndex: 200,
                elevation: 10,
              },
              row: {
                backgroundColor: 'transparent',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(255,255,255,0.05)',
              },
              description: {
                color: '#fff',
                fontSize: 14,
              },
              separator: {
                height: 0,
              },
            }}
            textInputProps={{
              placeholderTextColor: 'rgba(255,255,255,0.3)',
            }}
            enablePoweredByContainer={false}
          />
          <TouchableOpacity onPress={() => filterSheetRef.current?.expand()} style={styles.filterBtn}>
            <Icon name="options" color="#A78BFA" size={20} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {selectedMarker?.type === 'event' && (
        <SelectedEventPopup
          event={selectedMarker.data}
          onClose={() => setSelectedMarker(null)}
          onViewDetails={() => navigation.navigate('EventDetail', { eventId: selectedMarker.data._id })}
          onGetDirections={() => handleGetDirections(selectedMarker.data)}
        />
      )}

      {selectedMarker?.type === 'user' && (
        <SelectedUserPopup
          user={selectedMarker.data}
          onClose={() => setSelectedMarker(null)}
          onSayHi={() => handleSayHi(selectedMarker.data)}
        />
      )}

      <TouchableOpacity style={styles.myLocationBtn} onPress={handleRecenterLocation}>
        <Icon name={isFollowingUser ? "navigate" : "navigate-outline"} color={isFollowingUser ? "#7C3AED" : "#333333"} size={22} />
      </TouchableOpacity>

      {/* Create Event FAB */}
      <TouchableOpacity 
        style={styles.createEventFab}
        onPress={() => {
          ReactNativeHapticFeedback.trigger('impactMedium');
          navigation.navigate('CreateEvent');
        }}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={['20%', '45%', '85%']}
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={false}
      >
        <MapBottomSheet
          activeTab={activeBottomTab}
          onTabChange={setActiveBottomTab}
          events={events}
          users={nearbyUsers}
          isLoadingEvents={isLoadingEvents}
          isLoadingUsers={isLoadingUsers}
          onEventPress={(event) => navigation.navigate('EventDetail', { eventId: event._id })}
          onUserSayHi={handleSayHi}
          onEventMarkerFocus={focusMapOnEvent}
        />
      </BottomSheet>

      <BottomSheet
        ref={filterSheetRef}
        index={-1}
        snapPoints={['65%']}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
        )}
      >
        <FilterSheet
          filters={filters}
          onApply={(newFilters) => {
            setFilters(newFilters);
            filterSheetRef.current?.close();
            ReactNativeHapticFeedback.trigger('impactLight');
          }}
          onReset={() => setFilters({ species: [], radiusKm: 25, dateFilter: 'any' })}
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  loadingOverlay: {
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  bottomSheetBg: {
    backgroundColor: 'rgba(13,13,26,0.97)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 36,
  },
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    bottom: 384,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createEventFab: {
    position: 'absolute',
    left: 16,
    bottom: 280,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  searchSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
    zIndex: 100,
  },
  filterBtn: {
    backgroundColor: 'rgba(13,13,26,0.92)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MapDiscoveryScreen;
