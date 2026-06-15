import axios from 'axios';
import { EXPO_PUBLIC_GOOGLE_PLACES_API_KEY } from '@env';

const GOOGLE_PLACES_API_KEY = EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

console.log('🔍 Location Service Debug:');
console.log('  API Key exists:', !!GOOGLE_PLACES_API_KEY);
if (GOOGLE_PLACES_API_KEY) {
  console.log('  API Key length:', GOOGLE_PLACES_API_KEY.length);
  console.log('  API Key preview:', GOOGLE_PLACES_API_KEY.substring(0, 10) + '...');
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AutocompleteResponse {
  predictions: PlacePrediction[];
  status: string;
  error_message?: string;
}

export const locationService = {
  /**
   * Get location autocomplete suggestions from Google Places API
   */
  async getPlaceSuggestions(input: string): Promise<PlacePrediction[]> {
    // Normalize whitespace: collapse multiple spaces and trim edges.
    // Double spaces in programmatic address strings cause ZERO_RESULTS.
    const cleanInput = input.replace(/\s+/g, ' ').trim();

    if (!cleanInput || cleanInput.length < 2) {
      return [];
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('❌ Google Places API key not configured');
      return [];
    }

    try {
      console.log('🔍 Fetching place suggestions for:', cleanInput);
      
      const response = await axios.get<AutocompleteResponse>(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: cleanInput,
            key: GOOGLE_PLACES_API_KEY,
            types: '(cities)',
            language: 'en',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('📍 Places API status:', response.data.status);
      
      if (response.data.status === 'OK') {
        console.log('✅ Found', response.data.predictions.length, 'suggestions');
        return response.data.predictions;
      } else if (response.data.status === 'ZERO_RESULTS') {
        console.log('⚠️ No results found for:', input);
        return [];
      } else {
        console.warn('⚠️ Places API error:', response.data.status, response.data.error_message);
        return [];
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error('❌ Request timeout - check internet connection');
      } else if (error.response) {
        console.error('❌ Places API error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('❌ Network error - no response received');
      } else {
        console.error('❌ Error fetching place suggestions:', error.message);
      }
      return [];
    }
  },

  /**
   * Get place details by place_id
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('❌ Google Places API key not configured');
      return null;
    }

    try {
      console.log('🔍 Fetching place details for:', placeId);
      
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: GOOGLE_PLACES_API_KEY,
            fields: 'formatted_address,geometry,name',
          },
          timeout: 10000,
        }
      );

      if (response.data.status === 'OK') {
        console.log('✅ Place details fetched');
        return response.data.result;
      }

      console.warn('⚠️ Place details error:', response.data.status);
      return null;
    } catch (error: any) {
      console.error('❌ Error fetching place details:', error.message);
      return null;
    }
  },
};
