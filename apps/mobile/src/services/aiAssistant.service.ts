import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
  suggestions?: string[];
  timestamp: Date;
}

export interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  bio?: string;
}

interface ChatPayload {
  pet: {
    name: string;
    species: string;
    breed?: string;
    age?: number;
    gender?: string;
    bio?: string;
  };
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  message: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onSuggestions: (suggestions: string[]) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Stream AI chat response using XMLHttpRequest for SSE
 */
export const streamAIChat = (
  token: string,
  payload: ChatPayload,
  callbacks: StreamCallbacks,
): XMLHttpRequest => {
  const xhr = new XMLHttpRequest();
  const baseURL = api.defaults.baseURL || 'http://10.0.2.2:5000/api/v1';
  
  console.log('[AI Assistant] Starting stream:', { baseURL, endpoint: `${baseURL}/ai/assistant/chat` });
  
  xhr.open('POST', `${baseURL}/ai/assistant/chat`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${token}`);

  let buffer = '';
  let lastIndex = 0;

  xhr.onreadystatechange = () => {
    if (xhr.readyState >= 3) {
      const newData = xhr.responseText.slice(lastIndex);
      lastIndex = xhr.responseText.length;
      buffer += newData;

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          
          if (raw === '[DONE]') {
            console.log('[AI Assistant] Stream completed');
            callbacks.onDone();
            return;
          }

          try {
            const parsed = JSON.parse(raw);
            
            if (parsed.error) {
              console.error('[AI Assistant] Stream error:', parsed);
              callbacks.onError(parsed.message || 'An error occurred');
              return;
            }
            
            if (parsed.text) {
              callbacks.onChunk(parsed.text);
            }
            
            if (parsed.suggestions) {
              callbacks.onSuggestions(parsed.suggestions);
            }
          } catch (err) {
            console.warn('[AI Assistant] Failed to parse SSE data:', raw, err);
          }
        }
      }
    }

    if (xhr.readyState === 4) {
      if (xhr.status !== 200) {
        console.error('[AI Assistant] Request failed:', { status: xhr.status, response: xhr.responseText });
        const errorMsg = xhr.status === 429 
          ? 'AI is busy, try again in a moment.' 
          : xhr.status === 401
          ? 'Authentication failed. Please log in again.'
          : 'Network error. Please check your connection.';
        callbacks.onError(errorMsg);
      }
    }
  };

  xhr.onerror = () => {
    console.error('[AI Assistant] Network error');
    callbacks.onError('Network error. Please check your connection.');
  };

  xhr.send(JSON.stringify(payload));
  return xhr;
};

/**
 * Conversation history persistence
 */
const HISTORY_KEY_PREFIX = 'pawspace:ai:history:';
const MAX_MESSAGES = 20;

export const saveConversationHistory = async (
  userId: string,
  petId: string,
  messages: Message[],
): Promise<void> => {
  try {
    const key = `${HISTORY_KEY_PREFIX}${userId}:${petId}`;
    const trimmed = messages.slice(-MAX_MESSAGES);
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save conversation history:', error);
  }
};

export const loadConversationHistory = async (
  userId: string,
  petId: string,
): Promise<Message[]> => {
  try {
    const key = `${HISTORY_KEY_PREFIX}${userId}:${petId}`;
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored) as Message[];
    // Convert timestamp strings back to Date objects
    return parsed.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error('Failed to load conversation history:', error);
    return [];
  }
};

export const clearConversationHistory = async (
  userId: string,
  petId: string,
): Promise<void> => {
  try {
    const key = `${HISTORY_KEY_PREFIX}${userId}:${petId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear conversation history:', error);
  }
};

/**
 * Quick action prompts
 */
export const getQuickActionPrompt = (action: string, petName: string, breed?: string): string => {
  const prompts: Record<string, string> = {
    'food': `What should I feed ${petName} and how often? Include portion sizes.`,
    'grooming': `What's the grooming routine I should follow for ${petName}? How often and what tools do I need?`,
    'health': `What are the key health checks and vaccinations ${petName} needs at their age?`,
    'training': `What are the best training tips for a ${breed || 'pet'}? Where should I start?`,
    'breed': `Tell me the key traits, temperament, and care needs for a ${breed || 'pet'}.`,
  };
  
  return prompts[action] || '';
};
