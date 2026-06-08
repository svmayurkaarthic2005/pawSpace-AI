import { BaseAIService, AI_MODELS, ChatMessage } from './base.ai.service';
import { AIFeature } from '../../models/aiInteraction.model';
import { PetProfile } from './pet-assistant.ai.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MeetupIdea {
  title: string;
  description: string;
  location?: string;
  petFriendly: boolean;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a friendly social connector for PawSpace, a pet social networking app. Your job is to help pet owners break the ice and connect with other pet owners in a natural, warm way.

ICEBREAKER RULES:
1. Reference SPECIFIC details about both users' pets — names, breeds, ages
2. Find common ground (same species, similar breeds, compatible sizes)
3. Keep it casual and conversational — like a text message, not a formal introduction
4. Include a natural question to invite a response
5. Never be creepy or overly personal — focus on the pets
6. 1-2 sentences max per icebreaker

MEETUP IDEA RULES:
1. Be specific to the location if provided
2. Consider the pets' species, sizes, and energy levels
3. Suggest realistic, pet-friendly venues
4. Include both indoor and outdoor options
5. Consider the season/weather if inferable

RESPONSE FORMAT: Return ONLY valid JSON arrays, no markdown.`;

// ─── Service ──────────────────────────────────────────────────────────────────

export class ConversationStarterAIService extends BaseAIService {
  protected readonly feature: AIFeature = 'conversation_starter';
  protected readonly fallbackResponse = JSON.stringify([
    "Your pet looks amazing! I'd love to know more about them 🐾",
    "We should arrange a playdate for our pets sometime!",
    "Your pet photos are adorable — what's their favorite activity?",
  ]);

  /**
   * Generate 3 personalized icebreaker messages.
   */
  async generateIcebreakers(
    userId: string,
    userPets: PetProfile[],
    recipientPets: PetProfile[],
  ): Promise<string[]> {
    if (userPets.length === 0 || recipientPets.length === 0) {
      return JSON.parse(this.fallbackResponse) as string[];
    }

    const myPetsDesc = userPets
      .map((p) => `${p.name} (${p.breed ?? p.species}${p.age ? `, ${p.age}y` : ''})`)
      .join(', ');

    const theirPetsDesc = recipientPets
      .map((p) => `${p.name} (${p.breed ?? p.species}${p.age ? `, ${p.age}y` : ''})`)
      .join(', ');

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate 3 icebreaker messages I can send to another pet owner.

My pets: ${myPetsDesc}
Their pets: ${theirPetsDesc}

Return ONLY a JSON array of 3 strings:
["message1", "message2", "message3"]`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.FAST,
      temperature: 0.85,
      maxTokens: 300,
    });

    try {
      const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as string[];
      return Array.isArray(parsed) ? parsed.slice(0, 3) : JSON.parse(this.fallbackResponse) as string[];
    } catch {
      return JSON.parse(this.fallbackResponse) as string[];
    }
  }

  /**
   * Generate location-aware meetup ideas.
   */
  async generateMeetupIdeas(
    userId: string,
    pets: PetProfile[],
    location?: string,
  ): Promise<MeetupIdea[]> {
    const petsDesc = pets
      .map((p) => `${p.name} (${p.breed ?? p.species})`)
      .join(', ');

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Suggest 4 meetup ideas for pet owners with: ${petsDesc}${location ? ` in ${location}` : ''}.

Return ONLY a JSON array:
[{"title": "...", "description": "...", "location": "...", "petFriendly": true}]`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.FAST,
      temperature: 0.8,
      maxTokens: 400,
    });

    try {
      const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as MeetupIdea[];
    } catch {
      return [
        { title: 'Dog Park Meetup', description: 'Meet at the local dog park for a morning play session', petFriendly: true },
        { title: 'Pet-Friendly Café', description: 'Grab coffee at a pet-friendly café', petFriendly: true },
      ];
    }
  }
}

export const conversationStarterAI = new ConversationStarterAIService();
