import { useState, useRef, useCallback, useEffect } from 'react';
import * as Keychain from 'react-native-keychain';
import { useAuthStore } from '../store/authStore';
import { STORAGE_KEYS } from '../constants';
import {
  Message,
  PetProfile,
  streamAIChat,
  saveConversationHistory,
  loadConversationHistory,
  clearConversationHistory as clearHistory,
  getQuickActionPrompt,
} from '../services/aiAssistant.service';

export const useAIPetAssistant = (initialPet?: PetProfile) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | undefined>(initialPet);
  
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Load conversation history when pet changes
  useEffect(() => {
    if (selectedPet && user?.id) {
      loadConversationHistory(user.id, selectedPet.id).then(setMessages);
    }
  }, [selectedPet?.id, user?.id]);

  // Save conversation history when messages change (but not while streaming)
  useEffect(() => {
    if (!isStreaming && selectedPet && user?.id && messages.length > 0) {
      saveConversationHistory(user.id, selectedPet.id, messages);
    }
  }, [messages, isStreaming, selectedPet?.id, user?.id]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !selectedPet || !user) return;
    if (isStreaming) return;

    // Get token directly from Keychain (same as axios interceptor does)
    let token: string | null = null;
    try {
      const credentials = await Keychain.getGenericPassword({
        service: STORAGE_KEYS.ACCESS_TOKEN,
      });
      token = credentials ? credentials.password : null;
    } catch (error) {
      console.error('[AI Assistant] Failed to get token from Keychain:', error);
    }

    // Fallback to Zustand store
    if (!token) {
      token = useAuthStore.getState().accessToken;
    }

    if (!token) {
      console.error('[AI Assistant] No access token available');
      return;
    }

    console.log('[AI Assistant] Sending message:', { 
      petName: selectedPet.name, 
      messageLength: text.length,
      hasToken: !!token,
      tokenPreview: token.substring(0, 20) + '...'
    });

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    // Add placeholder AI message
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      role: 'ai',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setIsStreaming(true);
    setStreamingMessageId(aiMessageId);
    setSuggestions([]);

    // Build conversation history for context
    const history = messages
      .filter(msg => !msg.isStreaming)
      .slice(-10)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

    const payload = {
      pet: {
        name: selectedPet.name,
        species: selectedPet.species,
        breed: selectedPet.breed,
        age: selectedPet.age,
        gender: selectedPet.gender,
        bio: selectedPet.bio,
      },
      history,
      message: text.trim(),
    };

    console.log('[AI Assistant] Sending payload:', { 
      petName: payload.pet.name, 
      historyLength: payload.history.length 
    });

    let fullResponse = '';

    xhrRef.current = streamAIChat(token, payload, {
      onChunk: (chunk: string) => {
        fullResponse += chunk;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: fullResponse }
              : msg
          )
        );
      },
      onSuggestions: (newSuggestions: string[]) => {
        console.log('[AI Assistant] Received suggestions:', newSuggestions);
        setSuggestions(newSuggestions);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, suggestions: newSuggestions }
              : msg
          )
        );
      },
      onDone: () => {
        console.log('[AI Assistant] Stream completed successfully');
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
        setStreamingMessageId(null);
        xhrRef.current = null;
      },
      onError: (error: string) => {
        console.error('[AI Assistant] Stream error:', error);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content: fullResponse || error || 'Sorry, something went wrong. Please try again.',
                  isStreaming: false,
                }
              : msg
          )
        );
        setIsStreaming(false);
        setStreamingMessageId(null);
        xhrRef.current = null;
      },
    });
  }, [selectedPet, user, messages, isStreaming]);

  const stopGenerating = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsStreaming(false);
    setStreamingMessageId(null);
    
    // Mark the current streaming message as complete
    setMessages(prev =>
      prev.map(msg =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    );
  }, []);

  const sendQuickAction = useCallback((action: string) => {
    if (!selectedPet) return;
    const prompt = getQuickActionPrompt(action, selectedPet.name, selectedPet.breed);
    if (prompt) {
      sendMessage(prompt);
    }
  }, [selectedPet, sendMessage]);

  const clearConversation = useCallback(async () => {
    if (selectedPet && user?.id) {
      await clearHistory(user.id, selectedPet.id);
      setMessages([]);
      setSuggestions([]);
    }
  }, [selectedPet, user?.id]);

  const changePet = useCallback((pet: PetProfile) => {
    // Save current conversation before switching
    if (selectedPet && user?.id && messages.length > 0) {
      saveConversationHistory(user.id, selectedPet.id, messages);
    }
    
    setSelectedPet(pet);
    setSuggestions([]);
    
    // Load new pet's history (will trigger via useEffect)
  }, [selectedPet, user?.id, messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    streamingMessageId,
    suggestions,
    selectedPet,
    sendMessage,
    stopGenerating,
    sendQuickAction,
    clearConversation,
    changePet,
  };
};
