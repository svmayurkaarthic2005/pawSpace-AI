import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { PERMISSIONS, RESULTS, request, check } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';
import api from '../services/api';

type LocationState = {
  granted: boolean;
  denied: boolean;
  blocked: boolean;
  coords: { latitude: number; longitude: number } | null;
  accuracy: number | null;
};

const PERMISSION =
  Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

// ─── Module-level singletons ─────────────────────────────────────────────────
// These persist for the lifetime of the JS bundle, surviving tab navigation.

let globalWatchId: number | null = null;
let bgGeoConfigured = false;

// Cached permission + coords so re-mounting the hook never re-prompts
let cachedState: LocationState = {
  granted: false,
  denied: false,
  blocked: false,
  coords: null,
  accuracy: null,
};

const postLocationUpdate = async (latitude: number, longitude: number, accuracy: number) => {
  try {
    await api.post('/map/location', { lat: latitude, lng: longitude, accuracy });
    console.log(`📡 [Backend] Location POSTed: ${latitude}, ${longitude}`);
  } catch (err) {
    console.warn('Failed to update server location:', err);
  }
};

const useLocation = () => {
  // Initialise from the module-level cache so state is never reset on remount
  const [locationState, setLocationState] = useState<LocationState>(cachedState);

  const isMountedRef = useRef(true);
  const locationFetchingRef = useRef(false);

  // Keep the cache in sync whenever state updates
  const updateState = useCallback((updater: (s: LocationState) => LocationState) => {
    setLocationState((prev) => {
      const next = updater(prev);
      cachedState = next;
      return next;
    });
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (locationFetchingRef.current) return;
    locationFetchingRef.current = true;

    Geolocation.getCurrentPosition(
      (pos) => {
        locationFetchingRef.current = false;
        if (!isMountedRef.current) return;
        const { latitude, longitude, accuracy } = pos.coords;
        updateState((s) => ({ ...s, coords: { latitude, longitude }, accuracy, granted: true }));
        postLocationUpdate(latitude, longitude, accuracy);
      },
      (error) => {
        locationFetchingRef.current = false;
        if (error.code === 2 || error.code === 3) {
          Geolocation.getCurrentPosition(
            (pos) => {
              if (!isMountedRef.current) return;
              const { latitude, longitude, accuracy } = pos.coords;
              updateState((s) => ({ ...s, coords: { latitude, longitude }, accuracy, granted: true }));
              postLocationUpdate(latitude, longitude, accuracy);
            },
            () => {},
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [updateState]);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        if (!isMountedRef.current) return;

        if (
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          updateState((s) => ({ ...s, granted: true, denied: false, blocked: false }));
          getCurrentLocation();
        } else {
          updateState((s) => ({ ...s, denied: true }));
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      const result = await request(PERMISSION);
      if (!isMountedRef.current) return;

      if (result === RESULTS.GRANTED) {
        updateState((s) => ({ ...s, granted: true, denied: false, blocked: false }));
        getCurrentLocation();
      } else if (result === RESULTS.DENIED) {
        updateState((s) => ({ ...s, denied: true }));
      } else if (result === RESULTS.BLOCKED) {
        updateState((s) => ({ ...s, blocked: true }));
      }
    }
  }, [updateState, getCurrentLocation]);

  const checkPermission = useCallback(async () => {
    // If already granted (from cache), skip the OS check — never re-prompt
    if (cachedState.granted) {
      if (!cachedState.coords) getCurrentLocation();
      return;
    }

    const result = await check(PERMISSION);
    if (!isMountedRef.current) return;

    if (result === RESULTS.GRANTED) {
      updateState((s) => ({ ...s, granted: true, denied: false, blocked: false }));
      getCurrentLocation();
    } else if (result === RESULTS.DENIED) {
      // Show the in-app LocationPermissionModal — don't auto-pop the OS dialog
      // If already marked as denied/skipped in cache, preserve that state
      updateState((s) => ({
        ...s,
        granted: false,
        denied: cachedState.denied,
        blocked: false,
      }));
    } else if (result === RESULTS.UNAVAILABLE) {
      console.warn('[useLocation] Location unavailable on this device');
    } else if (result === RESULTS.BLOCKED) {
      updateState((s) => ({ ...s, blocked: true }));
    }
  }, [getCurrentLocation, updateState]);

  // Configure Transistorsoft Background Geolocation
  const setupBackgroundGeolocation = useCallback(async () => {
    if (bgGeoConfigured) return;

    BackgroundGeolocation.onLocation(
      (location) => {
        console.log('📍 [BackgroundGeolocation] -', location.coords.latitude, location.coords.longitude);
        if (!isMountedRef.current) return;
        updateState((s) => ({
          ...s,
          coords: { latitude: location.coords.latitude, longitude: location.coords.longitude },
          accuracy: location.coords.accuracy,
        }));
        postLocationUpdate(location.coords.latitude, location.coords.longitude, location.coords.accuracy);
      },
      (error) => {
        console.warn('📍 [BackgroundGeolocation] ERROR:', error);
      }
    );

    const state = await BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 50,
      stopOnTerminate: false,
      startOnBoot: true,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      notification: {
        title: 'PawSpace is active',
        text: 'Tracking location for nearby pet owners',
        color: '#7C3AED',
      },
    });
    bgGeoConfigured = true;
    console.log('⚙️ [BackgroundGeolocation] ready:', state.enabled);
  }, [updateState]);

  const startBackgroundTracking = useCallback(async () => {
    if (!bgGeoConfigured) await setupBackgroundGeolocation();
    await BackgroundGeolocation.start();
    console.log('▶️ [BackgroundGeolocation] started');
  }, [setupBackgroundGeolocation]);

  const stopBackgroundTracking = useCallback(async () => {
    await BackgroundGeolocation.stop();
    console.log('⏹️ [BackgroundGeolocation] stopped');
  }, []);

  const stopWatching = useCallback((watchId: number) => {
    Geolocation.clearWatch(watchId);
    globalWatchId = null; // Reset singleton so startWatching works again on remount
    console.log('🛑 [useLocation] Watch cleared, globalWatchId reset');
  }, []);

  const skipPermission = useCallback(() => {
    updateState((s) => ({ ...s, denied: true }));
    console.log('🛑 [useLocation] Permission skipped, denied set to true');
  }, [updateState]);

  const startWatching = useCallback(() => {
    if (globalWatchId !== null) return globalWatchId;

    const watchId = Geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        const { latitude, longitude, accuracy } = pos.coords;

        updateState((prevState) => {
          const prevCoords = prevState.coords;
          if (
            prevCoords &&
            Math.abs(prevCoords.latitude - latitude) < 0.0001 &&
            Math.abs(prevCoords.longitude - longitude) < 0.0001
          ) {
            return prevState;
          }
          postLocationUpdate(latitude, longitude, accuracy);
          return { ...prevState, coords: { latitude, longitude }, accuracy };
        });
      },
      (error) => console.warn('Location watch error:', error.message),
      { enableHighAccuracy: true, distanceFilter: 50, interval: 15000, fastestInterval: 10000 }
    );

    globalWatchId = watchId;
    return watchId;
  }, [updateState]);

  useEffect(() => {
    isMountedRef.current = true;
    checkPermission();
    setupBackgroundGeolocation();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    ...locationState,
    requestPermission,
    checkPermission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    skipPermission,
    startBackgroundTracking,
    stopBackgroundTracking,
  };
};

export default useLocation;
