import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  assistantChat, getBreedAdvice,
  generateCaptions, streamCaption,
  getEventRecommendations,
  smartSearch,
  getConversationStarters,
  getAIUsage,
} from '../controllers/ai.controller';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Pet Assistant
router.post('/assistant/chat', assistantChat);
router.get('/assistant/breed/:breed', getBreedAdvice);

// Captions
router.post('/captions/generate', generateCaptions);
router.post('/captions/stream', streamCaption);

// Events
router.post('/events/recommendations', getEventRecommendations);

// Smart Search
router.post('/search', smartSearch);

// Conversation Starters
router.post('/conversation-starters', getConversationStarters);

// Usage
router.get('/usage', getAIUsage);

export default router;
