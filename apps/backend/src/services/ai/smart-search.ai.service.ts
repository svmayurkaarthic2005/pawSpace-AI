import { BaseAIService, AI_MODELS, ChatMessage } from './base.ai.service';
import { AIFeature } from '../../models/aiInteraction.model';
import { Post } from '../../models/post.model';
import { Event } from '../../models/event.model';
import { Community } from '../../models/community.model';
import { User } from '../../models/user.model';
import { UserLocation } from '../../models/userLocation.model';
import mongoose from 'mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchType = 'event' | 'community' | 'user' | 'post' | 'mixed';

export interface SearchIntent {
  type: SearchType;
  species: string[];
  location: string | null;
  dateRange: {
    label: string;
    days: number;
  } | null;
  keywords: string[];
  radius: number;
}

export interface UserLocationCoords {
  lat: number;
  lng: number;
}

export interface SearchResults {
  posts: any[];
  events: any[];
  communities: any[];
  users: any[];
}

export interface SmartSearchResult {
  intent: SearchIntent;
  results: SearchResults;
  totalCount: number;
  suggestion: string | null;
}

// ─── Smart Search AI Service ──────────────────────────────────────────────────

class SmartSearchAIService extends BaseAIService {
  protected readonly feature: AIFeature = 'smart_search';
  protected readonly fallbackResponse = JSON.stringify({
    type: 'mixed',
    species: [],
    location: null,
    dateRange: null,
    keywords: [],
    radius: 25,
  });

  // ── Parse natural language query into structured intent ───────────────────

  async parseQuery(
    query: string,
    userId: string,
    userLocation?: UserLocationCoords,
  ): Promise<SearchIntent> {
    const locationStr = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : 'unknown';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a search intent parser for a pet social app. Parse user queries into structured JSON.

Pet species: dog, cat, rabbit, bird, hamster, guinea pig, fish, reptile, other

Search types:
- event: user wants to find pet events/meetups
- community: user wants to find groups/communities
- user: user wants to find people/pet owners
- post: user wants to find posts/content
- mixed: unclear or combination

Return ONLY valid JSON, no preamble or explanation:
{
  "type": "event|community|user|post|mixed",
  "species": ["dog","cat",...] or [],
  "location": "city name" or null,
  "dateRange": { "label": "this weekend|today|this week|next month", "days": 7 } or null,
  "keywords": ["meetup","golden","retriever",...],
  "radius": 25
}

Examples:
"dog parks near me" → {"type":"post","species":["dog"],"location":null,"dateRange":null,"keywords":["parks","near"],"radius":5}
"cat events this weekend" → {"type":"event","species":["cat"],"location":null,"dateRange":{"label":"this weekend","days":3},"keywords":["events"],"radius":25}
"golden retriever community" → {"type":"community","species":["dog"],"location":null,"dateRange":null,"keywords":["golden","retriever"],"radius":25}`,
      },
      {
        role: 'user',
        content: `Query: "${query}"\nUser location: ${locationStr}`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.FAST,
      temperature: 0.3,
      maxTokens: 256,
    });

    return this.parseIntentJSON(result.text, query);
  }

  // ── Parse and validate JSON response ───────────────────────────────────────

  private parseIntentJSON(text: string, originalQuery: string): SearchIntent {
    try {
      // Extract JSON from response (handle cases where AI adds text around JSON)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);

      return {
        type: ['event', 'community', 'user', 'post', 'mixed'].includes(parsed.type)
          ? parsed.type
          : 'mixed',
        species: Array.isArray(parsed.species) ? parsed.species : [],
        location: parsed.location || null,
        dateRange: parsed.dateRange || null,
        keywords: Array.isArray(parsed.keywords)
          ? parsed.keywords
          : originalQuery.split(' ').filter((w) => w.length > 2),
        radius: typeof parsed.radius === 'number' ? parsed.radius : 25,
      };
    } catch {
      // Fallback: split query into keywords
      return {
        type: 'mixed',
        species: [],
        location: null,
        dateRange: null,
        keywords: originalQuery.split(' ').filter((w) => w.length > 2),
        radius: 25,
      };
    }
  }

  // ── Execute search based on parsed intent ─────────────────────────────────

  async executeSearch(
    intent: SearchIntent,
    userId: string,
    userLocation?: UserLocationCoords,
  ): Promise<SearchResults> {
    const searchPromises: Promise<any>[] = [];

    // Posts
    if (intent.type === 'post' || intent.type === 'mixed') {
      searchPromises.push(this.searchPosts(intent));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Events
    if (intent.type === 'event' || intent.type === 'mixed') {
      searchPromises.push(this.searchEvents(intent, userLocation));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Communities
    if (intent.type === 'community' || intent.type === 'mixed') {
      searchPromises.push(this.searchCommunities(intent));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Users
    if (intent.type === 'user' || intent.type === 'mixed') {
      searchPromises.push(this.searchUsers(intent, userId, userLocation));
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    const [posts, events, communities, users] = await Promise.all(searchPromises);

    return { posts, events, communities, users };
  }

  // ── Search Posts ───────────────────────────────────────────────────────────

  private async searchPosts(intent: SearchIntent): Promise<any[]> {
    const query: any = { visibility: 'public' };

    // Keywords in hashtags or caption
    if (intent.keywords.length > 0) {
      query.$or = [
        { hashtags: { $in: intent.keywords.map((k) => k.toLowerCase()) } },
        { caption: { $regex: intent.keywords.join('|'), $options: 'i' } },
      ];
    }

    let postsQuery = Post.find(query)
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(20)
      .populate('author', 'username name avatar')
      .populate('pet', 'name species avatar')
      .lean();

    const posts = await postsQuery;

    // Filter by species if specified (client-side since pet is populated)
    if (intent.species.length > 0) {
      return posts.filter(
        (p: any) => p.pet && intent.species.includes(p.pet.species.toLowerCase()),
      );
    }

    return posts;
  }

  // ── Search Events ──────────────────────────────────────────────────────────

  private async searchEvents(
    intent: SearchIntent,
    userLocation?: UserLocationCoords,
  ): Promise<any[]> {
    const query: any = { status: 'upcoming' };

    // Date range
    if (intent.dateRange) {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + (intent.dateRange.days ?? 7));
      query.startDate = { $gte: start, $lte: end };
    }

    // Species
    if (intent.species.length > 0) {
      query.petFriendlySpecies = { $in: intent.species };
    }

    // Keywords in title/description/tags
    if (intent.keywords.length > 0) {
      query.$or = [
        { title: { $regex: intent.keywords.join('|'), $options: 'i' } },
        { description: { $regex: intent.keywords.join('|'), $options: 'i' } },
        { tags: { $in: intent.keywords.map((k) => k.toLowerCase()) } },
      ];
    }

    // Geo search
    if (userLocation && intent.radius) {
      const events = await Event.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [userLocation.lng, userLocation.lat],
            },
            distanceField: 'distance',
            maxDistance: intent.radius * 1000, // km to meters
            spherical: true,
            query,
          },
        },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creator',
          },
        },
        { $unwind: '$creator' },
        {
          $project: {
            title: 1,
            description: 1,
            coverImage: 1,
            location: 1,
            startDate: 1,
            endDate: 1,
            petFriendlySpecies: 1,
            maxAttendees: 1,
            rsvpCount: 1,
            tags: 1,
            status: 1,
            distance: 1,
            'creator.username': 1,
            'creator.name': 1,
            'creator.avatar': 1,
          },
        },
      ]);
      return events;
    }

    // No geo search
    return Event.find(query)
      .sort({ startDate: 1 })
      .limit(20)
      .populate('creator', 'username name avatar')
      .lean();
  }

  // ── Search Communities ─────────────────────────────────────────────────────

  private async searchCommunities(intent: SearchIntent): Promise<any[]> {
    const query: any = {};

    const orConditions: any[] = [];

    // Keywords in name/tags
    if (intent.keywords.length > 0) {
      orConditions.push(
        { name: { $regex: intent.keywords.join('|'), $options: 'i' } },
        { tags: { $in: intent.keywords.map((k) => k.toLowerCase()) } },
      );
    }

    // Species
    if (intent.species.length > 0) {
      orConditions.push({ species: { $in: intent.species } });
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    return Community.find(query)
      .sort({ memberCount: -1 })
      .limit(15)
      .populate('creator', 'username name avatar')
      .lean();
  }

  // ── Search Users ───────────────────────────────────────────────────────────

  private async searchUsers(
    intent: SearchIntent,
    currentUserId: string,
    userLocation?: UserLocationCoords,
  ): Promise<any[]> {
    // Geo search for nearby users
    if (userLocation && intent.keywords.length === 0) {
      return this.searchNearbyUsers(currentUserId, userLocation, intent.radius);
    }

    // Name/username search
    const query: any = {
      _id: { $ne: new mongoose.Types.ObjectId(currentUserId) },
    };

    if (intent.keywords.length > 0) {
      query.$or = [
        { username: { $regex: intent.keywords.join('|'), $options: 'i' } },
        { name: { $regex: intent.keywords.join('|'), $options: 'i' } },
      ];
    }

    return User.find(query)
      .select('username name avatar bio followerCount')
      .limit(15)
      .lean();
  }

  // ── Search Nearby Users ────────────────────────────────────────────────────

  private async searchNearbyUsers(
    currentUserId: string,
    location: UserLocationCoords,
    radiusKm: number,
  ): Promise<any[]> {
    const nearbyLocations = await UserLocation.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [location.lng, location.lat],
          },
          distanceField: 'distance',
          maxDistance: radiusKm * 1000,
          spherical: true,
          query: { user: { $ne: new mongoose.Types.ObjectId(currentUserId) } },
        },
      },
      { $limit: 15 },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          distance: 1,
          'user._id': 1,
          'user.username': 1,
          'user.name': 1,
          'user.avatar': 1,
          'user.bio': 1,
        },
      },
    ]);

    return nearbyLocations.map((loc) => ({
      ...loc.user,
      distance: Math.round(loc.distance / 1000), // meters to km
    }));
  }

  // ── Generate suggestion if no results ──────────────────────────────────────

  async generateSuggestion(
    query: string,
    intent: SearchIntent,
    userId: string,
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a helpful search assistant for a pet social app. The user's search returned no results. Suggest an alternative search query or browsing action. Keep it short (max 15 words) and friendly.`,
      },
      {
        role: 'user',
        content: `User searched for: "${query}"\nParsed intent: ${JSON.stringify(intent)}\n\nSuggest an alternative.`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.FAST,
      temperature: 0.8,
      maxTokens: 64,
    });

    return result.text.trim().replace(/^["']|["']$/g, '');
  }
}

export const smartSearchAIService = new SmartSearchAIService();
