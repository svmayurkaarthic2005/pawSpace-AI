import React, { forwardRef, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  ToastAndroid,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { SelectedLocation } from '../../screens/feed/CreatePostScreen';

interface GooglePlace {
  id: string;
  name: string;
  address: string;
  coordinates?: [number, number];
}

interface LocationSheetProps {
  snapPoints: string[];
  onSelectLocation: (location: SelectedLocation) => void;
}

const RECENT_LOCATIONS_KEY = 'pawspace:recent:locations';
const MAX_RECENT = 3;

const LocationSheet = forwardRef<BottomSheet, LocationSheetProps>(
  ({ snapPoints, onSelectLocation }, ref) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GooglePlace[]>([]);
    const [recentLocations, setRecentLocations] = useState<GooglePlace[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    useEffect(() => {
      loadRecentLocations();
    }, []);

    const loadRecentLocations = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
        if (stored) {
          setRecentLocations(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load recent locations:', error);
      }
    };

    const saveRecentLocation = async (location: GooglePlace) => {
      try {
        const updated = [location, ...recentLocations.filter((l) => l.id !== location.id)].slice(0, MAX_RECENT);
        await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
        setRecentLocations(updated);
      } catch (error) {
        console.error('Failed to save recent location:', error);
      }
    };

    const renderBackdrop = useMemo(
      () => (props: any) => (
        <BottomSheetBackdrop
          {...props}
          opacity={0.5}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      []
    );

    const handleSearch = async (searchQuery: string) => {
      if (searchQuery.trim().length === 0) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get<{ data: GooglePlace[] }>('/google-places/autocomplete', {
          params: { q: searchQuery },
        });
        setResults(data.data || []);
      } catch (error) {
        console.error('Location search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const handleQueryChange = (text: string) => {
      setQuery(text);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        handleSearch(text);
      }, 400);

      setSearchTimeout(timeout as unknown as number | null);
    };

    const handleSelectPlace = async (place: GooglePlace) => {
      try {
        // Get full details with coordinates if not already present
        if (!place.coordinates) {
          const { data } = await api.get<{ data: GooglePlace }>('/google-places/details', {
            params: { placeId: place.id },
          });
          place = data.data;
        }

        if (place.coordinates) {
          onSelectLocation({
            name: place.name,
            coordinates: place.coordinates,
          });
          await saveRecentLocation(place);
        } else {
          Alert.alert('Error', 'Could not get location coordinates');
        }
      } catch (error) {
        console.error('Failed to get place details:', error);
        Alert.alert('Error', 'Failed to select location');
      }
    };

    const handleUseCurrentLocation = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'App needs access to your location to find you.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Location permission is required.');
            return;
          }
        } catch (err) {
          console.warn(err);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('📍 LocationSheet Raw GPS Coords:', { latitude, longitude });

          try {
            console.log('🌍 Calling /google-places/reverse-geocode');
            const { data } = await api.get<{ data: GooglePlace }>('/google-places/reverse-geocode', {
              params: { lat: latitude, lng: longitude },
              timeout: 10000,
            });
            console.log('🌍 LocationSheet Geocode Response:', data);

            const place = data.data;
            if (place && place.coordinates) {
              onSelectLocation({
                name: place.name,
                coordinates: place.coordinates,
              });
              await saveRecentLocation(place);
            } else {
              throw new Error('Invalid place data returned');
            }
          } catch (error: any) {
            console.error('Reverse geocode error:', error.message || error);
            
            // Added detailed logging per requirements
            console.log('🌍 Axios Error Details:', {
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              code: error.code,
              message: error.message,
              hasResponse: !!error.response
            });
            
            // Fallback logic
            const fallbackLocationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            onSelectLocation({
              name: fallbackLocationName,
              coordinates: [longitude, latitude],
            });
            
            if (Platform.OS === 'android') {
              ToastAndroid.show('Could not fetch address, but location detected', ToastAndroid.SHORT);
            } else {
              Alert.alert('Location Detected', 'Could not fetch address, but exact coordinates were saved.');
            }
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          Alert.alert('Location Error', 'Please enable location services to use this feature');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    const renderLocationItem = ({ item }: { item: GooglePlace }) => (
      <TouchableOpacity style={styles.locationItem} onPress={() => handleSelectPlace(item)}>
        <View style={styles.locationIcon}>
          <Icon name="location" size={24} color="#10B981" />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.locationAddress} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>
    );

    const displayList = query.trim().length > 0 ? results : recentLocations;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.indicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Add location</Text>

          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search for a location..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {loading && <ActivityIndicator size="small" color="#7C3AED" />}
          </View>

          <TouchableOpacity style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
            <View style={styles.currentLocationIcon}>
              <Icon name="navigate" size={22} color="#7C3AED" />
            </View>
            <Text style={styles.currentLocationText}>Use current location</Text>
          </TouchableOpacity>

          {query.trim().length === 0 && recentLocations.length > 0 && (
            <Text style={styles.sectionTitle}>Recent</Text>
          )}

          <FlatList
            data={displayList}
            renderItem={renderLocationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              query.trim().length > 0 && !loading ? (
                <View style={styles.emptyContainer}>
                  <Icon name="search-outline" size={48} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyText}>No locations found</Text>
                </View>
              ) : null
            }
          />
        </View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#1A1A2E',
  },
  indicator: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  currentLocationIcon: {
    width: 40,
    alignItems: 'center',
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  locationIcon: {
    width: 40,
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
});

export default LocationSheet;
