import { BaseAIService, AI_MODELS, ChatMessage } from './base.ai.service';
import { AIFeature } from '../../models/aiInteraction.model';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PetProfile {
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  bio?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are PawSpace AI, a warm, knowledgeable, and friendly veterinary assistant for a pet social networking app. You have deep expertise in animal care, nutrition, behavior, grooming, and general wellness.

CORE RULES:
1. NEVER diagnose medical conditions — always recommend consulting a licensed veterinarian for health concerns
2. NEVER make up or assume information about the pet that wasn't explicitly provided (age, health conditions, behaviors, etc.)
3. If you don't know specific details about the pet, ask clarifying questions or provide general advice for the breed/species
4. Be warm, encouraging, and use pet-owner friendly language (not overly clinical)
5. Use the pet's name when you know it — it makes responses feel personal
6. Keep responses concise but complete — use bullet points for lists
7. Add relevant emojis sparingly to make responses feel friendly (🐾 🐕 🐈 ❤️)
8. If asked about emergencies (vomiting blood, seizures, difficulty breathing), immediately direct to emergency vet
9. Acknowledge the emotional bond between owners and their pets
10. ONLY reference pet details that are explicitly provided in the pet context - do not invent ages, conditions, or history

EXPERTISE AREAS:
- Nutrition and diet recommendations by species/breed/age
- Grooming schedules and techniques
- Exercise and enrichment needs
- Behavioral guidance and training tips
- Preventive care schedules (vaccines, flea/tick, dental)
- Life stage care (puppy/kitten, adult, senior)
- Common breed-specific traits and needs

IMPORTANT: When pet details like age or health history are not provided, acknowledge this and either:
- Ask the owner for this information if it's relevant to their question
- Provide general guidance that applies across age ranges or health statuses`;

// ─── Service ──────────────────────────────────────────────────────────────────

export class PetAssistantAIService extends BaseAIService {
  protected readonly feature: AIFeature = 'pet_assistant';
  protected readonly fallbackResponse =
    "I'm having trouble connecting right now. For urgent pet health questions, please contact your veterinarian directly. 🐾";

  /**
   * Multi-turn chat with pet context. Keeps last 10 messages.
   */
  async chat(
    userId: string,
    pet: PetProfile,
    history: ChatMessage[],
    userMessage: string,
  ): Promise<string> {
    // Build pet context with only provided information
    const petDetails: string[] = [`Name: ${pet.name}`, `Species: ${pet.species}`];
    if (pet.breed) petDetails.push(`Breed: ${pet.breed}`);
    if (pet.age !== undefined && pet.age !== null) petDetails.push(`Age: ${pet.age} years`);
    if (pet.gender) petDetails.push(`Gender: ${pet.gender}`);
    if (pet.bio) petDetails.push(`Bio: ${pet.bio}`);
    
    const petContext = `The user is asking about their pet:\n${petDetails.join('\n')}\n\nIMPORTANT: Only use the information provided above. Do not assume or invent additional details about ${pet.name}.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${petContext}` },
      // Keep last 10 messages for context window efficiency
      ...history.slice(-10),
      { role: 'user', content: userMessage },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.SMART,
      temperature: 0.75,
      maxTokens: 600,
    });

    return result.text;
  }

  /**
   * Streaming chat — yields tokens as they arrive.
   */
  async *chatStream(
    userId: string,
    pet: PetProfile,
    history: ChatMessage[],
    userMessage: string,
  ): AsyncGenerator<string> {
    // Build pet context with only provided information
    const petDetails: string[] = [`Name: ${pet.name}`, `Species: ${pet.species}`];
    if (pet.breed) petDetails.push(`Breed: ${pet.breed}`);
    if (pet.age !== undefined && pet.age !== null) petDetails.push(`Age: ${pet.age} years`);
    if (pet.gender) petDetails.push(`Gender: ${pet.gender}`);
    if (pet.bio) petDetails.push(`Bio: ${pet.bio}`);
    
    const petContext = `The user is asking about their pet:\n${petDetails.join('\n')}\n\nIMPORTANT: Only use the information provided above. Do not assume or invent additional details about ${pet.name}.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${petContext}` },
      ...history.slice(-10),
      { role: 'user', content: userMessage },
    ];

    yield* this.stream(userId, messages, {
      model: AI_MODELS.SMART,
      temperature: 0.75,
      maxTokens: 600,
    });
  }

  /**
   * Breed-specific care guide.
   */
  async getBreedAdvice(userId: string, breed: string): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Give me a comprehensive care guide for a ${breed}. Cover: temperament, exercise needs, grooming requirements, common health issues to watch for, training tips, and ideal living environment. Format with clear sections and bullet points.`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.SMART,
      temperature: 0.6,
      maxTokens: 800,
    });

    return result.text;
  }

  /**
   * Dietary recommendations tailored to the pet.
   */
  async getFoodSuggestions(userId: string, pet: PetProfile): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `What should I feed ${pet.name}, my ${pet.age ? `${pet.age}-year-old ` : ''}${pet.breed ?? pet.species}? Please cover:
- Recommended food types (dry, wet, raw)
- Portion sizes and feeding frequency
- Key nutrients to look for
- Foods to absolutely avoid
- Any breed or age-specific dietary considerations
Keep it practical and actionable.`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.SMART,
      temperature: 0.6,
      maxTokens: 600,
    });

    return result.text;
  }

  /**
   * Grooming schedule and tips.
   */
  async getGroomingTips(userId: string, pet: PetProfile): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Create a grooming schedule and tips for ${pet.name}, a ${pet.breed ?? pet.species}. Include:
- Brushing frequency and recommended tools
- Bathing schedule and products
- Nail trimming frequency
- Ear cleaning routine
- Dental care
- Any breed-specific grooming needs
Format as a clear weekly/monthly schedule.`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.SMART,
      temperature: 0.6,
      maxTokens: 600,
    });

    return result.text;
  }

  /**
   * Generate follow-up question suggestions based on the last AI response.
   */
  async getSuggestedFollowUps(userId: string, pet: PetProfile, lastResponse: string): Promise<string[]> {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant. Generate exactly 3 short follow-up questions a pet owner might ask after reading the given response. Return ONLY a JSON array of 3 strings, nothing else.' },
      {
        role: 'user',
        content: `Pet: ${pet.name} (${pet.breed ?? pet.species})\nPrevious response: "${lastResponse.slice(0, 500)}"\n\nGenerate 3 natural follow-up questions.`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.FAST,
      temperature: 0.8,
      maxTokens: 200,
    });

    try {
      const parsed = JSON.parse(result.text) as string[];
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch {
      return ['What foods should I avoid?', 'How often should I visit the vet?', 'What are signs of illness?'];
    }
  }
}

export const petAssistantAI = new PetAssistantAIService();
