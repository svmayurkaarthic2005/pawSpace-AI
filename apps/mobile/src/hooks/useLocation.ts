import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS, request, check } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
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
let watchCount = 0;

const useLocation = () => {
  const [locationState, setLocationState] = useState<LocationState>({
    granted: false,
    denied: false,
    blocked: false,
    coords: null,
    accuracy: null,
  });

  const isMountedRef = useRef(true);
  const locationFetchingRef = useRef(false); // Prevent concurrent location fetches

  const requestPermission = useCallback(async () => {
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
  }, []);

  const getCurrentLocation = useCallback(() => {
    // Prevent concurrent location fetches to avoid race conditions
    if (locationFetchingRef.current) {
      console.log('📍 Location fetch already in progress, skipping...');
      return;
    }
    
    locationFetchingRef.current = true;
    
    Geolocation.getCurrentPosition(
      (pos) => {
        locationFetchingRef.current = false;
        if (!isMountedRef.current) return;
        
        const { latitude, longitude, accuracy } = pos.coords;
        console.log('📍 Location acquired:', { latitude, longitude, accuracy });
        setLocationState((s) => ({ ...s, coords: { latitude, longitude }, accuracy, granted: true }));
        
        // Update server in background
        api
          .post('/map/location', { lat: latitude, lng: longitude, accuracy })
          .catch((err) => console.warn('Failed to update server location:', err));
      },
      (error) => {
        console.warn('Location error:', error.code, error.message);
        // Retry with lower accuracy if high accuracy fails (timeout or position unavailable)
        if (error.code === 2 || error.code === 3) {
          Geolocation.getCurrentPosition(
            (pos) => {
              locationFetchingRef.current = false;
              if (!isMountedRef.current) return;
              
              const { latitude, longitude, accuracy } = pos.coords;
              console.log('📍 Location acquired (fallback):', { latitude, longitude, accuracy });
              setLocationState((s) => ({ ...s, coords: { latitude, longitude }, accuracy, granted: true }));
            },
            (retryError) => {
              locationFetchingRef.current = false;
              console.warn('Location retry error:', retryError);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          locationFetchingRef.current = false;
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
    } else if (result === RESULTS.DENIED) {
      requestPermission();
    } else if (result === RESULTS.BLOCKED) {
      setLocationState((s) => ({ ...s, blocked: true }));
    } else {
      requestPermission();
    }
  }, [getCurrentLocation, requestPermission]);

  const startWatching = useCallback(() => {
    // CRITICAL: Prevent multiple watches from being created
    if (globalWatchId !== null) {
      console.log('⚠️  Watch already exists (ID:', globalWatchId, '), reusing it');
      return globalWatchId;
    }
    
    watchCount++;
    console.log('📍 Starting NEW location watch #' + watchCount);
    
    const watchId = Geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        
        // Debounce rapid updates - only update if location changed significantly
        const { latitude, longitude, accuracy } = pos.coords;
        
        setLocationState((prevState) => {
          const prevCoords = prevState.coords;
          
          // Skip update if location hasn't changed (prevents duplicate API calls)
          if (prevCoords && 
              Math.abs(prevCoords.latitude - latitude) < 0.0001 &&
              Math.abs(prevCoords.longitude - longitude) < 0.0001) {
            console.log('📍 Location unchanged, skipping update');
            return prevState;
          }
          
          console.log('📍 Location watch updated:', { latitude, longitude, accuracy });
          
          // Update server in background (non-blocking)
          api
            .post('/map/location', { lat: latitude, lng: longitude, accuracy })
            .catch((err) => console.warn('Failed to update server location:', err));
          
          return { ...prevState, coords: { latitude, longitude }, accuracy };
        });
      },
      (error) => console.warn('Location watch error:', error.code, error.message),
      { 
        enableHighAccuracy: true, 
        distanceFilter: 50, // Only update if moved 50m
        interval: 15000, // Check every 15s
        fastestInterval: 10000 // Don't check faster than 10s
      }
    );
    
    globalWatchId = watchId;
    console.log('✅ Watch started with GLOBAL ID:', globalWatchId);
    return watchId;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Check permission on mount
    checkPermission();

    return () => {
      isMountedRef.current = false;
    };
  }, []); // Run only once on mount

  return { ...locationState, requestPermission, checkPermission, getCurrentLocation, startWatching };
};

export default useLocation;
