import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
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

// GLOBAL singleton to prevent multiple watches
let globalWatchId: number | null = null;
let bgGeoConfigured = false;

const postLocationUpdate = async (latitude: number, longitude: number, accuracy: number) => {
  try {
    await api.post('/map/location', { lat: latitude, lng: longitude, accuracy });
    console.log(`📡 [Backend] Location POSTed: ${latitude}, ${longitude}`);
  } catch (err) {
    console.warn('Failed to update server location:', err);
  }
};

const useLocation = () => {
  const [locationState, setLocationState] = useState<LocationState>({
    granted: false,
    denied: false,
    blocked: false,
    coords: null,
    accuracy: null,
  });

  const isMountedRef = useRef(true);
  const locationFetchingRef = useRef(false);

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
          setLocationState((s) => ({ ...s, granted: true, denied: false, blocked: false }));
          getCurrentLocation();
        } else {
          setLocationState((s) => ({ ...s, denied: true }));
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      const result = await request(PERMISSION);
      if (!isMountedRef.current) return;
      
      if (result === RESULTS.GRANTED) {
        setLocationState((s) => ({ ...s, granted: true, denied: false, blocked: false }));
        getCurrentLocation();
      } else if (result === RESULTS.DENIED) {
        setLocationState((s) => ({ ...s, denied: true }));
      } else if (result === RESULTS.BLOCKED) {
        setLocationState((s) => ({ ...s, blocked: true }));
      }
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (locationFetchingRef.current) return;
    locationFetchingRef.current = true;
    
    Geolocation.getCurrentPosition(
      (pos) => {
        locationFetchingRef.current = false;
        if (!isMountedRef.current) return;
        
        const { latitude, longitude, accuracy } = pos.coords;
        setLocationState((s) => ({ ...s, coords: { latitude, longitude }, accuracy, granted: true }));
        postLocationUpdate(latitude, longitude, accuracy);
      },
      (error) => {
        locationFetchingRef.current = false;
        if (error.code === 2 || error.code === 3) {
          Geolocation.getCurrentPosition(
            (pos) => {
              if (!isMountedRef.current) return;
              const { latitude, longitude, accuracy } = pos.coords;
              setLocationState((s) => ({ ...s, coords: { latitude, longitude }, accuracy, granted: true }));
              postLocationUpdate(latitude, longitude, accuracy);
            },
            () => {},
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const checkPermission = useCallback(async () => {
    const result = await check(PERMISSION);
    if (!isMountedRef.current) return;
    
    if (result === RESULTS.GRANTED) {
      setLocationState((s) => ({ ...s, granted: true }));
      getCurrentLocation();
    } else if (result === RESULTS.DENIED || result === RESULTS.UNAVAILABLE) {
      requestPermission();
    } else if (result === RESULTS.BLOCKED) {
      setLocationState((s) => ({ ...s, blocked: true }));
    }
  }, [getCurrentLocation, requestPermission]);

  // Configure Transistorsoft Background Geolocation
  const setupBackgroundGeolocation = useCallback(async () => {
    if (bgGeoConfigured) return;

    BackgroundGeolocation.onLocation((location) => {
      console.log('📍 [BackgroundGeolocation] -', location.coords.latitude, location.coords.longitude);
      if (!isMountedRef.current) return;
      setLocationState((s) => ({
        ...s,
        coords: { latitude: location.coords.latitude, longitude: location.coords.longitude },
        accuracy: location.coords.accuracy,
      }));
      postLocationUpdate(location.coords.latitude, location.coords.longitude, location.coords.accuracy);
    }, (error) => {
      console.warn('📍 [BackgroundGeolocation] ERROR:', error);
    });

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
        color: '#7C3AED'
      }
    });
    bgGeoConfigured = true;
    console.log('⚙️ [BackgroundGeolocation] ready:', state.enabled);
  }, []);

  const startBackgroundTracking = useCallback(async () => {
    if (!bgGeoConfigured) await setupBackgroundGeolocation();
    await BackgroundGeolocation.start();
    console.log('▶️ [BackgroundGeolocation] started');
  }, [setupBackgroundGeolocation]);

  const stopBackgroundTracking = useCallback(async () => {
    await BackgroundGeolocation.stop();
    console.log('⏹️ [BackgroundGeolocation] stopped');
  }, []);

  const startWatching = useCallback(() => {
    if (globalWatchId !== null) return globalWatchId;
    
    const watchId = Geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        const { latitude, longitude, accuracy } = pos.coords;
        
        setLocationState((prevState) => {
          const prevCoords = prevState.coords;
          if (prevCoords && 
              Math.abs(prevCoords.latitude - latitude) < 0.0001 &&
              Math.abs(prevCoords.longitude - longitude) < 0.0001) {
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
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    checkPermission();
    setupBackgroundGeolocation();
    return () => {
      isMountedRef.current = false;
      // We don't remove background geolocation listeners here to allow them to live as singletons
    };
  }, []);

  return { 
    ...locationState, 
    requestPermission, 
    checkPermission, 
    getCurrentLocation, 
    startWatching,
    startBackgroundTracking,
    stopBackgroundTracking
  };
};

export default useLocation;
