import Groq from 'groq-sdk';
import { env } from '../../config/env';
import { Community } from '../../models/community.model';
import { Pet } from '../../models/pet.model';
import { CommunityMembership } from '../../models/communityMembership.model';
import { redis } from '../../config/redis';
import mongoose from 'mongoose';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

class CommunityRecommendationAIService {
  private readonly model = 'llama3-8b-8192';
  private readonly cacheKeyPrefix = 'communities:recommended:';
  private readonly cacheTTL = 3600; // 1 hour

  /**
   * Get AI-powered community recommendations for a user
   */
  async recommend(userId: string): Promise<any[]> {
    try {
      // Check Redis cache first
      const cacheKey = `${this.cacheKeyPrefix}${userId}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        console.log(`[AI] Cache hit for user ${userId} community recommendations`);
        const communityIds = JSON.parse(cached);
        return await this.fetchCommunitiesByIds(communityIds);
      }

      // Fetch user context
      const userContext = await this.getUserContext(userId);
      
      // Fetch available communities (not joined by user)
      const availableCommunities = await this.getAvailableCommunities(userId);

      if (availableCommunities.length === 0) {
        return [];
      }

      // Prepare prompt
      const prompt = this.buildPrompt(userContext, availableCommunities);

      // Call Groq AI
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are an AI that recommends pet communities. Analyze user pets and community data to suggest the most relevant communities. Return ONLY a JSON array of community IDs ordered by relevance.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '[]';
      
      // Parse AI response
      const recommendedIds = this.parseAIResponse(responseText, availableCommunities);

      // Cache the result
      await redis.set(cacheKey, JSON.stringify(recommendedIds), 'EX', this.cacheTTL);

      // Fetch full community documents
      const recommendations = await this.fetchCommunitiesByIds(recommendedIds);

      console.log(`[AI] Generated ${recommendations.length} community recommendations for user ${userId}`);

      return recommendations;
    } catch (error) {
      console.error('[AI] Community recommendation error:', error);
      // Fallback: return popular communities
      return await this.getFallbackRecommendations(userId);
    }
  }

  /**
   * Get user context for recommendations
   */
  private async getUserContext(userId: string) {
    // Fetch user's pets
    const pets = await Pet.find({ owner: userId }).select('species breed name').lean();

    // Fetch user's joined community IDs
    const memberships = await CommunityMembership.find({ user: userId })
      .select('community')
      .lean();
    const joinedCommunityIds = memberships.map((m) => m.community.toString());

    return {
      pets,
      petSpecies: [...new Set(pets.map((p) => p.species))],
      petBreeds: [...new Set(pets.map((p) => p.breed).filter(Boolean))],
      joinedCommunityIds,
    };
  }

  /**
   * Get communities user hasn't joined yet
   */
  private async getAvailableCommunities(userId: string) {
    const memberships = await CommunityMembership.find({ user: userId })
      .select('community')
      .lean();
    const joinedIds = memberships.map((m) => m.community);

    // Fetch top 30 communities by member count that user hasn't joined
    const communities = await Community.find({
      _id: { $nin: joinedIds },
      isPrivate: false,
    })
      .sort({ memberCount: -1 })
      .limit(30)
      .select('_id name species tags memberCount description')
      .lean();

    return communities;
  }

  /**
   * Build prompt for AI
   */
  private buildPrompt(userContext: any, communities: any[]): string {
    const petInfo =
      userContext.pets.length > 0
        ? userContext.pets.map((p: any) => `${p.name} (${p.species}${p.breed ? `, ${p.breed}` : ''})`).join(', ')
        : 'No pets yet';

    const communityList = communities
      .map(
        (c) =>
          `{id:"${c._id}",name:"${c.name}",species:[${c.species.map((s: string) => `"${s}"`).join(',')}],tags:[${c.tags.map((t: string) => `"${t}"`).join(',')}],members:${c.memberCount}}`,
      )
      .join(',');

    return `Given a user with pets: ${petInfo}

And these available communities:
[${communityList}]

Recommend the top 8 most relevant communities for this user based on:
1. Species match (highest priority)
2. Tags and interests
3. Community activity (member count)
4. Variety (don't just recommend one species)

Return ONLY a JSON array of community IDs in order of relevance. Example: ["id1","id2","id3"]`;
  }

  /**
   * Parse AI response and validate IDs
   */
  private parseAIResponse(responseText: string, availableCommunities: any[]): string[] {
    try {
      // Extract JSON array from response
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (!jsonMatch) {
        console.warn('[AI] No JSON array found in response');
        return this.getDefaultRecommendations(availableCommunities);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        console.warn('[AI] Response is not an array');
        return this.getDefaultRecommendations(availableCommunities);
      }

      // Validate IDs exist in available communities
      const validIds = availableCommunities.map((c) => c._id.toString());
      const recommendedIds = parsed
        .filter((id) => validIds.includes(id))
        .slice(0, 8);

      // If AI returned too few, supplement with popular ones
      if (recommendedIds.length < 6 && availableCommunities.length > recommendedIds.length) {
        const remaining = availableCommunities
          .filter((c) => !recommendedIds.includes(c._id.toString()))
          .slice(0, 6 - recommendedIds.length)
          .map((c) => c._id.toString());
        recommendedIds.push(...remaining);
      }

      return recommendedIds;
    } catch (error) {
      console.error('[AI] Failed to parse response:', error);
      return this.getDefaultRecommendations(availableCommunities);
    }
  }

  /**
   * Get default recommendations (fallback)
   */
  private getDefaultRecommendations(communities: any[]): string[] {
    return communities.slice(0, 8).map((c) => c._id.toString());
  }

  /**
   * Fetch communities by IDs in the given order
   */
  private async fetchCommunitiesByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    
    const communities = await Community.find({ _id: { $in: objectIds } })
      .select('_id name slug description avatar coverImage accentColor species tags memberCount isPrivate')
      .lean();

    // Sort by original order
    const communityMap = new Map(communities.map((c) => [c._id.toString(), c]));
    return ids.map((id) => communityMap.get(id)).filter(Boolean);
  }

  /**
   * Fallback recommendations (popular communities)
   */
  private async getFallbackRecommendations(userId: string): Promise<any[]> {
    const memberships = await CommunityMembership.find({ user: userId })
      .select('community')
      .lean();
    const joinedIds = memberships.map((m) => m.community);

    return await Community.find({
      _id: { $nin: joinedIds },
      isPrivate: false,
    })
      .sort({ memberCount: -1 })
      .limit(8)
      .select('_id name slug description avatar coverImage accentColor species tags memberCount isPrivate')
      .lean();
  }
}

export const communityRecommendationAIService = new CommunityRecommendationAIService();
