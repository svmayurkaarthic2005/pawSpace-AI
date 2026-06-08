import { Request, Response, NextFunction } from 'express';
import { petAssistantAI } from '../services/ai/pet-assistant.ai.service';
import { captionAI } from '../services/ai/caption.ai.service';
import { eventRecommendationAI } from '../services/ai/event-recommendation.ai.service';
import { smartSearchAIService } from '../services/ai/smart-search.ai.service';
import { conversationStarterAI } from '../services/ai/conversation-starter.ai.service';
import { AppError } from '../middleware/error';
import { successResponse } from '../utils';
import { ChatMessage } from '../services/ai/base.ai.service';
import { CaptionStyle } from '../services/ai/caption.ai.service';

// ─── SSE Helper ───────────────────────────────────────────────────────────────

const setupSSE = (res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();
};

const writeSSEChunk = (res: Response, data: unknown): void => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const endSSE = (res: Response): void => {
  res.write('data: [DONE]\n\n');
  res.end();
};

// ─── Pet Assistant ────────────────────────────────────────────────────────────

// POST /ai/assistant/chat — streaming SSE
export const assistantChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');

    const { pet, history, message } = req.body as {
      pet: { name: string; species: string; breed?: string; age?: number; gender?: string; bio?: string };
      history: ChatMessage[];
      message: string;
    };

    if (!message?.trim()) throw new AppError('Message is required', 400, true, 'VALIDATION_ERROR');
    if (!pet?.name) throw new AppError('Pet profile is required', 400, true, 'VALIDATION_ERROR');

    setupSSE(res);

    // Handle client disconnect
    req.on('close', () => res.end());

    let fullText = '';
    try {
      for await (const chunk of petAssistantAI.chatStream(req.user.userId, pet, history ?? [], message)) {
        fullText += chunk;
        writeSSEChunk(res, { text: chunk });
      }

      // Send follow-up suggestions after main response
      const suggestions = await petAssistantAI.getSuggestedFollowUps(req.user.userId, pet, fullText);
      writeSSEChunk(res, { suggestions });
    } catch (streamErr) {
      writeSSEChunk(res, { error: 'Stream interrupted', text: petAssistantAI['fallbackResponse'] });
    }

    endSSE(res);
  } catch (err) {
    next(err);
  }
};

// GET /ai/assistant/breed/:breed
export const getBreedAdvice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { breed } = req.params;
    if (!breed) throw new AppError('Breed is required', 400, true, 'VALIDATION_ERROR');
    const advice = await petAssistantAI.getBreedAdvice(req.user.userId, breed);
    res.status(200).json(successResponse({ advice }, 'Breed advice retrieved'));
  } catch (err) { next(err); }
};

// ─── Captions ─────────────────────────────────────────────────────────────────

// POST /ai/captions/generate
export const generateCaptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { pet, imageDescription, style } = req.body as {
      pet: { name: string; species: string; breed?: string; age?: number };
      imageDescription: string;
      style?: CaptionStyle;
    };
    if (!pet || !imageDescription) throw new AppError('Pet and imageDescription are required', 400, true, 'VALIDATION_ERROR');
    const result = await captionAI.generateCaptions(req.user.userId, pet, imageDescription, style ?? 'cute');
    res.status(200).json(successResponse(result, 'Captions generated'));
  } catch (err) { next(err); }
};

// POST /ai/captions/stream — SSE streaming
export const streamCaption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { pet, imageDescription, style } = req.body as {
      pet: { name: string; species: string; breed?: string };
      imageDescription: string;
      style?: CaptionStyle;
    };

    setupSSE(res);
    req.on('close', () => res.end());

    try {
      for await (const chunk of captionAI.streamCaption(req.user.userId, pet, imageDescription, style)) {
        writeSSEChunk(res, { text: chunk });
      }
    } catch {
      writeSSEChunk(res, { error: 'Stream error' });
    }

    endSSE(res);
  } catch (err) { next(err); }
};

// ─── Events ───────────────────────────────────────────────────────────────────

// POST /ai/events/recommendations
export const getEventRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const { user, pets, events } = req.body as {
      user: { username: string; location?: string; pastRsvpTags?: string[] };
      pets: Array<{ name: string; species: string; breed?: string; age?: number }>;
      events: Array<{
        id: string; title: string; description: string;
        petFriendlySpecies: string[]; tags: string[];
        startDate: string; location: { name: string; address: string };
        rsvpCount: number; maxAttendees?: number;
      }>;
    };
    const recommendations = await eventRecommendationAI.recommendEvents(req.user.userId, user, pets, events);
    res.status(200).json(successResponse({ recommendations }, 'Recommendations generated'));
  } catch (err) { next(err); }
};

// ─── Smart Search ─────────────────────────────────────────────────────────────

// POST /ai/search
export const smartSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { query, userLocation } = req.body as { 
      query: string; 
      userLocation?: { lat: number; lng: number } 
    };
    
    if (!query?.trim()) throw new AppError('Query is required', 400, true, 'VALIDATION_ERROR');

    // Step 1: Parse query into structured intent
    const intent = await smartSearchAIService.parseQuery(query, req.user.userId, userLocation);

    // Step 2: Execute search based on intent
    const results = await smartSearchAIService.executeSearch(intent, req.user.userId, userLocation);

    // Step 3: Calculate total results
    const totalCount = results.posts.length + results.events.length + results.communities.length + results.users.length;

    // Step 4: Generate suggestion if no results
    let suggestion: string | null = null;
    if (totalCount === 0) {
      suggestion = await smartSearchAIService.generateSuggestion(query, intent, req.user.userId);
    }

    res.status(200).json(successResponse({
      intent,
      results,
      totalCount,
      suggestion,
    }, 'Search completed'));
  } catch (err) { 
    next(err); 
  }
};

// ─── Conversation Starters ────────────────────────────────────────────────────

// POST /ai/conversation-starters
export const getConversationStarters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    
    const { recipientId, myPets, theirPets, petContext } = req.body as {
      recipientId?: string;
      myPets?: Array<{ name: string; species: string; breed?: string; age?: number }>;
      theirPets?: Array<{ name: string; species: string; breed?: string; age?: number }>;
      petContext?: { name: string; breed: string };
    };

    let userPets = myPets ?? [];
    let recipientPets = theirPets ?? [];

    // If recipientId provided, fetch pets from database
    if (recipientId) {
      const { Pet } = await import('../models/pet.model');
      
      const [myPetsFromDb, theirPetsFromDb] = await Promise.all([
        Pet.find({ owner: req.user.userId }).select('name species breed age').lean().exec(),
        Pet.find({ owner: recipientId }).select('name species breed age').lean().exec(),
      ]);

      userPets = myPetsFromDb.map((p: any) => ({
        name: p.name,
        species: p.species,
        breed: p.breed,
        age: p.age,
      }));

      recipientPets = theirPetsFromDb.map((p: any) => ({
        name: p.name,
        species: p.species,
        breed: p.breed,
        age: p.age,
      }));
    }

    // If petContext provided, use it to enhance
    if (petContext && recipientPets.length === 0) {
      recipientPets = [{ name: petContext.name, species: 'unknown', breed: petContext.breed }];
    }

    const starters = await conversationStarterAI.generateIcebreakers(req.user.userId, userPets, recipientPets);
    res.status(200).json(successResponse({ suggestions: starters }, 'Conversation starters generated'));
  } catch (err) { next(err); }
};

// ─── Usage Stats ──────────────────────────────────────────────────────────────

// GET /ai/usage
export const getAIUsage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Not authenticated', 401, true, 'NOT_AUTHENTICATED');
    const stats = await petAssistantAI.getUsageStats(req.user.userId);
    res.status(200).json(successResponse({ stats }, 'Usage stats retrieved'));
  } catch (err) { next(err); }
};
