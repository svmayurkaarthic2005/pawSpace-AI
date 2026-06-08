import { BaseAIService, AI_MODELS, ChatMessage } from './base.ai.service';
import { AIFeature } from '../../models/aiInteraction.model';
import { redis } from '../../config/redis';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostSummary {
  id: string;
  caption: string;
  hashtags: string[];
  species?: string;
  breed?: string;
  likesCount: number;
  commentsCount: number;
  authorFollowerCount: number;
  createdAt: string;
}

export interface UserFeedContext {
  breeds: string[];
  recentLikedHashtags: string[];
  followedHashtags: string[];
  location?: string;
  preferredSpecies?: string[];
}

export interface RankedPost {
  postId: string;
  score: number;
}

const FEED_RANK_CACHE_TTL = 600; // 10 minutes
const FEED_RANK_KEY = (userId: string) => `ai:feed_rank:${userId}`;

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a content ranking algorithm for PawSpace, a pet social network. Rank posts by predicted engagement and relevance to the user.

RANKING SIGNALS (weighted):
1. Species/breed match with user's pets (40%) — highest weight
2. Hashtag overlap with user's interests (25%)
3. Recency — newer posts score higher (20%)
4. Engagement rate — likes+comments relative to follower count (15%)

RESPONSE FORMAT: Return ONLY a JSON array sorted by score descending:
[{"postId": "id", "score": 95}, {"postId": "id2", "score": 87}, ...]

Score 0-100. Include ALL provided post IDs. Be fast — use the fast model.`;

// ─── Service ──────────────────────────────────────────────────────────────────

export class FeedAIService extends BaseAIService {
  protected readonly feature: AIFeature = 'feed_rank';
  protected readonly fallbackResponse = '[]';

  /**
   * Rank a list of posts for a user. Cached for 10 minutes.
   */
  async rankFeed(
    userId: string,
    posts: PostSummary[],
    userContext: UserFeedContext,
  ): Promise<RankedPost[]> {
    if (posts.length === 0) return [];

    // Check cache
    const cacheKey = FEED_RANK_KEY(userId);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as RankedPost[];
    }

    // Limit to 50 posts for token efficiency
    const postsToRank = posts.slice(0, 50);

    const postsDesc = postsToRank
      .map(
        (p) =>
          `ID:${p.id} | species:${p.species ?? 'unknown'} | breed:${p.breed ?? 'unknown'} | tags:${p.hashtags.slice(0, 5).join(',')} | likes:${p.likesCount} | age:${Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 3600000)}h`,
      )
      .join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `User context:
- Pets: ${userContext.breeds.join(', ') || 'unknown'}
- Liked hashtags: ${userContext.recentLikedHashtags.slice(0, 10).join(', ') || 'none'}
- Followed hashtags: ${userContext.followedHashtags.slice(0, 10).join(', ') || 'none'}
- Preferred species: ${userContext.preferredSpecies?.join(', ') || 'all'}

Posts to rank:
${postsDesc}

Rank all ${postsToRank.length} posts.`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.FAST, // Use fast model for feed ranking
      temperature: 0.3,
      maxTokens: 800,
    });

    try {
      const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const ranked = JSON.parse(cleaned) as RankedPost[];

      // Cache the result
      await redis.set(cacheKey, JSON.stringify(ranked), 'EX', FEED_RANK_CACHE_TTL);

      return ranked;
    } catch {
      // Return original order on parse failure
      return postsToRank.map((p, i) => ({ postId: p.id, score: 100 - i }));
    }
  }

  /**
   * Invalidate the feed rank cache for a user.
   */
  async invalidateFeedRank(userId: string): Promise<void> {
    await redis.del(FEED_RANK_KEY(userId));
  }
}

export const feedAI = new FeedAIService();
