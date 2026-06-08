import axios from 'axios';
import { env } from '../config/env';

const GOOGLE_PLACES_API_BASE = 'https://maps.googleapis.com/maps/api';
const TIMEOUT = 10000;

export interface GooglePlace {
  id: string;
  name: string;
  address: string;
  coordinates?: [number, number]; // [lng, lat]
}

/**
 * Check if Google Maps API is configured
 */
const isGoogleMapsConfigured = (): boolean => {
  return !!env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY.length > 20;
};

/**
 * Search places using Google Places Autocomplete API
 */
export const searchPlaces = async (
  query: string,
  location?: { lat: number; lng: number },
): Promise<GooglePlace[]> => {
  if (!isGoogleMapsConfigured()) {
    console.warn('[GooglePlaces] Google Maps API key not configured. Location search disabled.');
    return [];
  }

  try {
    const params: Record<string, string> = {
      input: query,
      key: env.GOOGLE_MAPS_API_KEY,
      types: 'establishment|geocode',
    };

    if (location) {
      params.location = `${location.lat},${location.lng}`;
      params.radius = '50000'; // 50km bias
    }

    const { data } = await axios.get(`${GOOGLE_PLACES_API_BASE}/place/autocomplete/json`, {
      params,
      timeout: TIMEOUT,
    });

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[GooglePlaces] Autocomplete error:', data.status, data.error_message);
      return [];
    }

    return (data.predictions ?? []).map((p: any) => ({
      id: p.place_id,
      name: p.structured_formatting?.main_text || p.description,
      address: p.description,
    }));
  } catch (error) {
    console.error('[GooglePlaces] searchPlaces error:', error);
    return [];
  }
};

/**
 * Get place details including coordinates
 */
export const getPlaceDetails = async (placeId: string): Promise<GooglePlace | null> => {
  if (!isGoogleMapsConfigured()) {
    console.warn('[GooglePlaces] Google Maps API key not configured. Place details disabled.');
    return null;
  }

  try {
    const { data } = await axios.get(`${GOOGLE_PLACES_API_BASE}/place/details/json`, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry',
        key: env.GOOGLE_MAPS_API_KEY,
      },
      timeout: TIMEOUT,
    });

    if (data.status !== 'OK' || !data.result) {
      console.error('[GooglePlaces] Details error:', data.status, data.error_message);
      return null;
    }

    const { result } = data;
    return {
      id: placeId,
      name: result.name || result.formatted_address,
      address: result.formatted_address,
      coordinates: result.geometry?.location
        ? [result.geometry.location.lng, result.geometry.location.lat]
        : undefined,
    };
  } catch (error) {
    console.error('[GooglePlaces] getPlaceDetails error:', error);
    return null;
  }
};

/**
 * Reverse geocode coordinates to get place name
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<GooglePlace | null> => {
  if (!isGoogleMapsConfigured()) {
    console.warn('[GooglePlaces] Google Maps API key not configured. Reverse geocoding disabled.');
    return null;
  }

  try {
    const { data } = await axios.get(`${GOOGLE_PLACES_API_BASE}/geocode/json`, {
      params: {
        latlng: `${lat},${lng}`,
        key: env.GOOGLE_MAPS_API_KEY,
      },
      timeout: TIMEOUT,
    });

    if (data.status !== 'OK' || !data.results?.[0]) {
      console.error('[GooglePlaces] Reverse geocode error:', data.status, data.error_message);
      return null;
    }

    const result = data.results[0];
    const name =
      result.address_components?.find((c: any) =>
        c.types.includes('neighborhood') ||
        c.types.includes('locality') ||
        c.types.includes('sublocality'),
      )?.long_name || result.formatted_address.split(',')[0];

    return {
      id: result.place_id,
      name,
      address: result.formatted_address,
      coordinates: [lng, lat],
    };
  } catch (error) {
    console.error('[GooglePlaces] reverseGeocode error:', error);
    return null;
  }
};
