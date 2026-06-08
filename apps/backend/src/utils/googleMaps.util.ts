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
      input: query,
      key: GOOGLE_MAPS_API_KEY,
    };

    if (proximity) {
      params.location = `${proximity.lat},${proximity.lng}`;
      params.radius = 50000; // 50km radius
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params,
    });

    if (response.data.status === 'OK' && response.data.predictions) {
      // Get place details for each prediction to retrieve coordinates
      const results = await Promise.all(
        response.data.predictions.slice(0, 5).map(async (prediction: any) => {
          const details = await getPlaceDetails(prediction.place_id);
          return {
            placeId: prediction.place_id,
            name: prediction.structured_formatting?.main_text || prediction.description,
            address: prediction.description,
            lat: details?.lat || 0,
            lng: details?.lng || 0,
          };
        })
      );
      return results.filter((r) => r.lat !== 0 && r.lng !== 0);
    }

    return [];
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

async function getPlaceDetails(placeId: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'geometry',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.result?.geometry?.location) {
      return {
        lat: response.data.result.geometry.location.lat,
        lng: response.data.result.geometry.location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error('Place details error:', error);
    return null;
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
