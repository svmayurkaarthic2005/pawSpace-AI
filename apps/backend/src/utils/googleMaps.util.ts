import axios from 'axios';
import { env } from '../config/env';

const GOOGLE_MAPS_API_KEY = env.GOOGLE_MAPS_API_KEY;

interface GeocodedResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface PlaceAutocompleteResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface DirectionsResult {
  coordinates: Array<{ latitude: number; longitude: number }>;
  duration: string;
  distance: string;
}

export async function geocodeAddress(address: string): Promise<GeocodedResult | null> {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
}

export async function getPlaceAutocomplete(
  query: string,
  proximity?: { lat: number; lng: number }
): Promise<PlaceAutocompleteResult[]> {
  try {
    const params: any = {
      query: query,
      key: GOOGLE_MAPS_API_KEY,
    };

    if (proximity) {
      params.location = `${proximity.lat},${proximity.lng}`;
      params.radius = 50000; // 50km bias
    }

    console.log(`[Backend] Geocode Request: textsearch for query="${query}"`);

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params,
    });

    console.log(`[Backend] Google API Status: ${response.data.status}`);
    
    if (response.data.error_message) {
      console.error(`[Backend] Google API Error: ${response.data.error_message}`);
    }

    if (response.data.status === 'OK' && response.data.results) {
      const results = response.data.results.slice(0, 5).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      }));
      
      return results.filter((r: any) => r.lat !== 0 && r.lng !== 0);
    }

    return [];
  } catch (error: any) {
    console.error('[Backend] Autocomplete error:', error?.response?.data || error.message);
    return [];
  }
}


export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: 'walking' | 'driving' = 'walking'
): Promise<DirectionsResult | null> {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      const polyline = route.overview_polyline.points;

      // Decode polyline
      const coordinates = decodePolyline(polyline);

      return {
        coordinates,
        duration: leg.duration.text,
        distance: leg.distance.text,
      };
    }

    return null;
  } catch (error) {
    console.error('Directions error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}

function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const result: Array<{ latitude: number; longitude: number }> = [];

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result_val = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result_val |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);

    lat += (result_val & 1) !== 0 ? ~(result_val >> 1) : result_val >> 1;

    shift = 0;
    result_val = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result_val |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);

    lng += (result_val & 1) !== 0 ? ~(result_val >> 1) : result_val >> 1;

    result.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return result;
}
