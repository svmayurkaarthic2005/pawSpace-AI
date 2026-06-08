import { BaseAIService, AI_MODELS, ChatMessage } from './base.ai.service';
import { AIFeature } from '../../models/aiInteraction.model';
import { PetProfile } from './pet-assistant.ai.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CaptionStyle = 'cute' | 'funny' | 'trendy' | 'inspirational';

export interface CaptionResult {
  captions: [string, string, string];
  hashtags: string[];
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a social media content expert specializing in pet content for Instagram, TikTok, and PawSpace. You have a deep understanding of viral pet content, trending hashtags, and what makes pet posts get maximum engagement.

STYLE GUIDELINES:
- cute: Warm, adorable, uses heart emojis, focuses on the pet's sweetness and innocence
- funny: Witty, playful, uses humor and relatable pet owner struggles, light sarcasm welcome
- trendy: Current internet slang, references memes, uses trending formats ("POV:", "No because...", "The way...")
- inspirational: Uplifting, focuses on the human-pet bond, life lessons from pets, heartwarming

CAPTION RULES:
1. Each caption should be 1-3 sentences max — Instagram users scroll fast
2. Include 1-2 relevant emojis naturally within the text
3. End with a question or call-to-action to boost comments
4. Make it feel authentic, not corporate
5. Reference the specific pet details when provided

HASHTAG RULES:
1. Mix of high-volume (#dogsofinstagram) and niche (#goldenretrieversofig) tags
2. Include the pet's species, breed, and personality-based tags
3. Always include #pawspace and #petlover
4. 15 hashtags total — optimized for reach`;

// ─── Service ──────────────────────────────────────────────────────────────────

export class CaptionAIService extends BaseAIService {
  protected readonly feature: AIFeature = 'caption_gen';
  protected readonly fallbackResponse = JSON.stringify({
    captions: [
      'Living my best life with my favorite human! 🐾',
      'Every day is an adventure when you have a pet by your side ✨',
      'This face says it all 😍 Pure joy, pure love',
    ],
    hashtags: ['#pawspace', '#petlover', '#dogsofinstagram', '#catsofinstagram', '#cutepets',
      '#petstagram', '#animallover', '#petsofinstagram', '#happypet', '#petlife',
      '#furever', '#petparent', '#adorable', '#fluffyanimals', '#petphotography'],
  });

  /**
   * Generate 3 captions + 15 hashtags for a pet post.
   */
  async generateCaptions(
    userId: string,
    pet: PetProfile,
    imageDescription: string,
    style: CaptionStyle = 'cute',
  ): Promise<CaptionResult> {
    const petDesc = `${pet.name}, a ${pet.age ? `${pet.age}-year-old ` : ''}${pet.breed ?? pet.species}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate captions for a photo of ${petDesc}.

Photo description: "${imageDescription}"
Style: ${style}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "captions": ["caption1", "caption2", "caption3"],
  "hashtags": ["#tag1", "#tag2", ..., "#tag15"]
}`,
      },
    ];

    const result = await this.complete(userId, messages, {
      model: AI_MODELS.SMART,
      temperature: 0.85,
      maxTokens: 600,
    });

    return this.parseCaptionResult(result.text);
  }

  /**
   * Stream a single caption token-by-token.
   */
  async *streamCaption(
    userId: string,
    pet: PetProfile,
    imageDescription: string,
    style: CaptionStyle = 'cute',
  ): AsyncGenerator<string> {
    const petDesc = `${pet.name}, a ${pet.breed ?? pet.species}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Write one ${style} Instagram caption for a photo of ${petDesc}. Photo: "${imageDescription}". Just the caption text, no hashtags, no quotes.`,
      },
    ];

    yield* this.stream(userId, messages, {
      model: AI_MODELS.SMART,
      temperature: 0.9,
      maxTokens: 150,
    });
  }

  private parseCaptionResult(raw: string): CaptionResult {
    try {
      // Strip markdown code blocks if present
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned) as { captions?: string[]; hashtags?: string[] };

      const captions = (parsed.captions ?? []).slice(0, 3);
      const hashtags = (parsed.hashtags ?? []).slice(0, 15);

      // Ensure we always have 3 captions
      while (captions.length < 3) {
        captions.push('Living my best life with my favorite human! 🐾');
      }

      return {
        captions: captions as [string, string, string],
        hashtags,
      };
    } catch {
      const fallback = JSON.parse(this.fallbackResponse) as CaptionResult;
      return fallback;
    }
  }
}

export const captionAI = new CaptionAIService();
