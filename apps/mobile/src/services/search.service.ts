import api from './api';
import {
  SmartSearchResponse,
  ExploreData,
  Post,
  SearchIntent,
  SearchResults,
} from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchQueryParams {
  query: string;
  userLocation?: {
    lat: number;
    lng: number;
  };
}

interface HashtagPostsParams {
  tag: string;
  page?: number;
}

interface HashtagPostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ─── Search Service ───────────────────────────────────────────────────────────

class SearchService {
  // Smart AI-powered search
  async smartSearch(params: SearchQueryParams): Promise<SmartSearchResponse> {
    const response = await api.post<{
      success: boolean;
      data: SmartSearchResponse;
      message: string;
    }>('/ai/search', {
      query: params.query,
      userLocation: params.userLocation,
    });
    return response.data.data;
  }

  // Get trending content for explore screen
  async getTrending(): Promise<ExploreData> {
    const response = await api.get<{
      success: boolean;
      data: ExploreData;
      message: string;
    }>('/explore/trending');
    return response.data.data;
  }

  // Get posts for a specific hashtag
  async getHashtagPosts(params: HashtagPostsParams): Promise<HashtagPostsResponse> {
    const response = await api.get<{
      success: boolean;
      data: HashtagPostsResponse;
      message: string;
    }>(`/explore/hashtag/${encodeURIComponent(params.tag)}`, {
      params: { page: params.page || 1 },
    });
    return response.data.data;
  }

  // Get search suggestions
  async getSuggestions(query?: string): Promise<string[]> {
    const response = await api.get<{
      success: boolean;
      data: { suggestions: string[] };
      message: string;
    }>('/search/suggestions', {
      params: query ? { q: query } : undefined,
    });
    return response.data.data.suggestions;
  }

  // Track search query (for popular searches)
  async trackSearch(query: string): Promise<void> {
    try {
      await api.post('/search/track', { query });
    } catch {
      // Non-critical, ignore errors
    }
  }
}

export const searchService = new SearchService();
export default searchService;
