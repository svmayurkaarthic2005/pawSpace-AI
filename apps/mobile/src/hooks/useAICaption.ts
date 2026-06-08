import { useState, useRef, useCallback } from 'react';
import { aiApi, PetProfile } from '../services/ai.service';

interface UseAICaptionState {
  caption: string;
  hashtags: string[];
  isStreaming: boolean;
  error: string | null;
}

export const useAICaption = () => {
  const [state, setState] = useState<UseAICaptionState>({
    caption: '',
    hashtags: [],
    isStreaming: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  /**
   * Stream a caption token-by-token into state.
   * Cancels any in-progress stream first.
   */
  const streamCaption = useCallback(
    async (
      pet: PetProfile,
      imageDescription: string,
      style: 'cute' | 'funny' | 'trendy' | 'inspirational' = 'cute',
    ) => {
      // Cancel previous stream
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState({ caption: '', hashtags: [], isStreaming: true, error: null });

      try {
        let accumulated = '';
        for await (const chunk of aiApi.streamCaption(pet, imageDescription, style, abortRef.current.signal)) {
          if (chunk.error) {
            setState((s) => ({ ...s, error: chunk.error ?? 'Stream error', isStreaming: false }));
            return;
          }
          if (chunk.text) {
            accumulated += chunk.text;
            setState((s) => ({ ...s, caption: accumulated }));
          }
        }
        setState((s) => ({ ...s, isStreaming: false }));
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return; // Intentional cancel
        setState((s) => ({
          ...s,
          isStreaming: false,
          error: 'Failed to generate caption. Please try again.',
        }));
      }
    },
    [],
  );

  /**
   * Generate full captions + hashtags (non-streaming).
   */
  const generateCaptions = useCallback(
    async (
      pet: PetProfile,
      imageDescription: string,
      style: 'cute' | 'funny' | 'trendy' | 'inspirational' = 'cute',
    ) => {
      setState({ caption: '', hashtags: [], isStreaming: true, error: null });
      try {
        const result = await aiApi.generateCaptions(pet, imageDescription, style);
        setState({
          caption: result.captions[0],
          hashtags: result.hashtags,
          isStreaming: false,
          error: null,
        });
        return result;
      } catch {
        setState((s) => ({
          ...s,
          isStreaming: false,
          error: 'Failed to generate captions.',
        }));
        return null;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ caption: '', hashtags: [], isStreaming: false, error: null });
  }, []);

  return {
    ...state,
    streamCaption,
    generateCaptions,
    cancel,
    reset,
  };
};
