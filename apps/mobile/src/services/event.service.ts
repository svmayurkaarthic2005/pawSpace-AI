import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventLocation {
  name: string;
  address: string;
  coordinates: { type: 'Point'; coordinates: [number, number] };
}

export interface EventCreator {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
}

export interface MapEvent {
  _id: string;
  creator: EventCreator;
  title: string;
  description: string;
  coverImage?: string;
  location: EventLocation;
  startDate: string;
  endDate: string;
  petFriendlySpecies: string[];
  maxAttendees?: number;
  rsvpCount: number;
  tags: string[];
  status: string;
  distanceMeters?: number;
  createdAt: string;
}

export interface RSVPStatus {
  rsvpCount: number;
  userStatus: 'going' | 'maybe' | 'not_going';
}

export interface DirectionsResult {
  route: {
    type: 'LineString';
    coordinates: number[][];
  };
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
}

export interface PlaceSuggestion {
  id: string;
  placeName: string;
  text: string;
  center: [number, number];
  context: string;
}

export interface NearbyUser {
  userId: string;
  username: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  distanceMeters: number;
  pets: Array<{ _id: string; name: string; species: string; breed?: string; images: Array<{ url: string }> }>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const eventApi = {
  async getNearbyEvents(lat: number, lng: number, radius = 25, species?: string): Promise<MapEvent[]> {
    const params: Record<string, string> = { lat: String(lat), lng: String(lng), radius: String(radius) };
    if (species) params.species = species;
    const { data } = await api.get<{ data: MapEvent[] }>('/events/nearby', { params });
    return data.data;
  },

  async getUpcomingEvents(page = 1, limit = 20): Promise<{ items: MapEvent[]; total: number }> {
    const { data } = await api.get<{ data: { items: MapEvent[]; total: number } }>('/events/upcoming', { params: { page, limit } });
    return data.data;
  },

  async getEventById(eventId: string): Promise<{ event: MapEvent; userRsvp: { status: string } | null }> {
    const { data } = await api.get(`/events/${eventId}`);
    return data.data;
  },

  async rsvpEvent(eventId: string, status: 'going' | 'maybe' | 'not_going'): Promise<RSVPStatus> {
    const { data } = await api.post<{ data: RSVPStatus }>(`/events/${eventId}/rsvp`, { status });
    return data.data;
  },

  async getAttendees(eventId: string, page = 1): Promise<{ items: Array<{ user: EventCreator; status: string }>; total: number }> {
    const { data } = await api.get(`/events/${eventId}/attendees`, { params: { page } });
    return data.data;
  },

  async createEvent(formData: FormData): Promise<MapEvent> {
    const { data } = await api.post<{ data: MapEvent }>('/events', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async getDirections(originLat: number, originLng: number, eventId: string): Promise<DirectionsResult | null> {
    const { data } = await api.get<{ data: DirectionsResult }>('/directions', {
      params: { originLat, originLng, eventId, profile: 'walking' },
    });
    return data.data;
  },

  async searchPlaces(q: string, proximityLng?: number, proximityLat?: number): Promise<PlaceSuggestion[]> {
    const params: Record<string, string> = { q };
    if (proximityLng !== undefined) params.proximityLng = String(proximityLng);
    if (proximityLat !== undefined) params.proximityLat = String(proximityLat);
    const { data } = await api.get<{ data: PlaceSuggestion[] }>('/places/search', { params });
    return data.data;
  },

  async updateLocation(lat: number, lng: number, accuracy?: number): Promise<void> {
    await api.post('/users/location', { lat, lng, accuracy });
  },

  async getNearbyUsers(lat: number, lng: number, radius = 10, species?: string): Promise<NearbyUser[]> {
    const params: Record<string, string> = { lat: String(lat), lng: String(lng), radius: String(radius) };
    if (species) params.species = species;
    const { data } = await api.get<{ data: NearbyUser[] }>('/users/nearby', { params });
    return data.data;
  },
};
