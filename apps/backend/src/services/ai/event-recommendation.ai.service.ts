import { BaseAIService, AI_MODELS, ChatMessage } from './base.ai.service';
import { AIFeature } from '../../models/aiInteraction.model';
import { PetProfile } from './pet-assistant.ai.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NearbyEvent {
  id: string;
  title: string;
  description: string;
  petFriendlySpecies: string[];
  tags: string[];
  startDate: string;
  location: { name: string; address: string };
  rsvpCount: number;
  maxAttendees?: number;
}

export interface EventRecommendation {
  eventId: string;
  score: number; // 0-100
  reason: string;
}

export interface UserContext {
  username: string;
  location?: string;
  pastRsvpTags?: string[];
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a local event curator for PawSpace, a pet social networking app. Your job is to recommend the most relevant pet-friendly events to users based on their pets' species, breeds, and the user's past activity.

RANKING CRITERIA (in order of importance):
1. Species compatibility — the event must welcome the user's pet species
2. Breed relevance — breed-specific events score higher for matching breeds
3. Timing — sooner events score higher (urgency)
4. Popularity — events with more RSVPs indicate quality
5. Tag overlap — events whose tags match the user's past RSVP tags
6. Capacity — events with available spots score higher

RESPONSE FORMAT:
Return ONLY valid JSON. No markdown, no explanation.
{
  "recommendations": [
    {"eventId": "id", "score": 85, "reason": "Perfect for Golden Retrievers — outdoor trail walk with other large breeds"},
    ...
  ]
}

Score 0-100. Rank all provided events. Be specific in reasons — mention the pet's name and breed.`;

// ─── Service ──────────────────────────────────────────────────────────────────

export class EventRecommendationAIService extends BaseAIService {
  protected readonly feature: AIFeature = 'event_rec';
  protected readonly fallbackResponse = JSON.stringify({ recommendations: [] });

  async recommendEvents(
    userId: string,
    user: UserContext,
    pets: PetProfile[],
    events: NearbyEvent[],
  ): Promise<EventRecommendation[]> {
    if (events.length === 0) return [];

    const petsDesc = pets
      .map((p) => `${p.name} (${p.breed ?? p.species}, ${p.age ? `${p.age}y` : 'age unknown'})`)
      .join(', ');

    const eventsDesc = events
      .map(
        (e) =>
          `ID: ${e.id} | "${e.title}" | Species: ${e.petFriendlySpecies.join(', ')} | Tags: ${e.tags.join(', ')} | Date: ${e.startDate} | RSVPs: ${e.rsvpCount}${e.maxAttendees ? `/${e.maxAttendees}` : ''}`,
      )
      .join('\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `User: ${user.username}${user.location ? ` (${user.location})` : ''}
Pets: ${petsDesc}
Past interests: ${user.pastRsvpTags?.join(', ') ?? 'none'}

Available events:
${eventsDesc}

Rank all ${events.length} events for this user.`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.FAST,
      temperature: 0.4,
      maxTokens: 800,
    });

    try {
      const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as { recommendations: EventRecommendation[] };
      return parsed.recommendations ?? [];
    } catch {
      return [];
    }
  }
}

export const eventRecommendationAI = new EventRecommendationAIService();
