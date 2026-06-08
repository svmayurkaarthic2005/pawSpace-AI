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

const useLocation = () => {
  const [locationState, setLocationState] = useState<LocationState>({
    granted: false,
    denied: false,
    blocked: false,
    coords: null,
    accuracy: null,
  });

  const isMountedRef = useRef(true);

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
    Geolocation.getCurrentPosition(
      (pos) => {
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
        // Retry with lower accuracy if high accuracy fails
        if (error.code === 2 || error.code === 3) {
          Geolocation.getCurrentPosition(
            (pos) => {
              if (!isMountedRef.current) return;
              
              const { latitude, longitude, accuracy } = pos.coords;
              console.log('📍 Location acquired (fallback):', { latitude, longitude, accuracy });
              setLocationState((s) => ({ ...s, coords: { latitude, longitude }, accuracy, granted: true }));
            },
            (retryError) => console.warn('Location retry error:', retryError),
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
    } else if (result === RESULTS.DENIED) {
      requestPermission();
    } else if (result === RESULTS.BLOCKED) {
      setLocationState((s) => ({ ...s, blocked: true }));
    } else {
      requestPermission();
    }
  }, [getCurrentLocation, requestPermission]);

  const startWatching = useCallback(() => {
    const watchId = Geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        
        const { latitude, longitude } = pos.coords;
        console.log('📍 Location updated:', { latitude, longitude });
        setLocationState((s) => ({ ...s, coords: { latitude, longitude } }));
        
        // Update server in background
        api
          .post('/map/location', { lat: latitude, lng: longitude, accuracy: pos.coords.accuracy })
          .catch((err) => console.warn('Failed to update server location:', err));
      },
      (error) => console.warn('Location watch error:', error.code, error.message),
      { enableHighAccuracy: true, distanceFilter: 50, interval: 15000, fastestInterval: 10000 }
    );
    return watchId;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Check permission on mount
    checkPermission();
    
    // Force location refresh after delay if granted but no coords
    const timer = setTimeout(() => {
      if (isMountedRef.current && locationState.granted && !locationState.coords) {
        console.log('🔄 Forcing initial location fetch...');
        getCurrentLocation();
      }
    }, 1000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [checkPermission, getCurrentLocation, locationState.granted, locationState.coords]);

  return { ...locationState, requestPermission, checkPermission, getCurrentLocation, startWatching };
};

export default useLocation;
