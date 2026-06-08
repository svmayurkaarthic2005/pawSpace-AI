import api from './api';
import { API_BASE_URL } from '../constants';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '../constants';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PetProfile {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  gender?: string;
  bio?: string;
}

export interface CaptionResult {
  captions: [string, string, string];
  hashtags: string[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SearchResults {
  posts: unknown[];
  events: unknown[];
  parsedQuery: {
    intent: string;
    filters: Record<string, unknown>;
    searchTerms: string[];
    originalQuery: string;
  };
}

// ─── SSE Stream Reader ────────────────────────────────────────────────────────

/**
 * Reads an SSE stream from a fetch response.
 * Yields each parsed data chunk.
 */
export async function* readSSEStream(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<{ text?: string; suggestions?: string[]; error?: string }> {
  const credentials = await Keychain.getGenericPassword({ service: STORAGE_KEYS.ACCESS_TOKEN });
  const token = credentials ? credentials.password : '';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`SSE request failed: ${response.status}`);
  }

  const reader = (response as any).body?.getReader() as any;
  if (!reader) throw new Error('No response body');

  const decoder = new (globalThis as any).TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            yield JSON.parse(data) as { text?: string; suggestions?: string[]; error?: string };
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── AI API ───────────────────────────────────────────────────────────────────

export const aiApi = {
  /**
   * Generate captions (non-streaming).
   */
  async generateCaptions(
    pet: PetProfile,
    imageDescription: string,
    style: 'cute' | 'funny' | 'trendy' | 'inspirational' = 'cute',
  ): Promise<CaptionResult> {
    const { data } = await api.post<{ data: CaptionResult }>('/ai/captions/generate', {
      pet,
      imageDescription,
      style,
    });
    return data.data;
  },

  /**
   * Stream a caption — returns an async generator.
   */
  streamCaption(
    pet: PetProfile,
    imageDescription: string,
    style = 'cute',
    signal?: AbortSignal,
  ) {
    return readSSEStream(
      `${API_BASE_URL}/ai/captions/stream`,
      { pet, imageDescription, style },
      signal,
    );
  },

  /**
   * Stream a pet assistant response.
   */
  streamAssistantChat(
    pet: PetProfile,
    history: ConversationMessage[],
    message: string,
    signal?: AbortSignal,
  ) {
    return readSSEStream(
      `${API_BASE_URL}/ai/assistant/chat`,
      { pet, history, message },
      signal,
    );
  },

  /**
   * Get breed advice.
   */
  async getBreedAdvice(breed: string): Promise<string> {
    const { data } = await api.get<{ data: { advice: string } }>(`/ai/assistant/breed/${encodeURIComponent(breed)}`);
    return data.data.advice;
  },

  /**
   * Natural language search.
   */
  async search(query: string): Promise<SearchResults> {
    const { data } = await api.post<{ data: SearchResults }>('/ai/search', { query });
    return data.data;
  },

  /**
   * Get conversation starters.
   */
  async getConversationStarters(
    myPets: PetProfile[],
    theirPets: PetProfile[],
  ): Promise<string[]> {
    const { data } = await api.post<{ data: { starters: string[] } }>('/ai/conversation-starters', {
      myPets,
      theirPets,
    });
    return data.data.starters;
  },

  /**
   * Get AI usage stats.
   */
  async getUsage(): Promise<Array<{ feature: string; count: number; totalTokens: number }>> {
    const { data } = await api.get<{ data: { stats: Array<{ feature: string; count: number; totalTokens: number }> } }>('/ai/usage');
    return data.data.stats;
  },
};
