import api from './api';

export interface AiInsight {
  title: string;
  content: string;
  category: 'health' | 'behavior' | 'nutrition' | 'training' | 'general';
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Get AI-powered insights for a pet based on its profile.
 */
export const getPetInsights = async (petId: string): Promise<AiInsight[]> => {
  const { data } = await api.get<{ data: AiInsight[] }>(`/ai/insights/${petId}`);
  return data.data;
};

/**
 * Send a message to the AI pet advisor.
 */
export const chatWithAdvisor = async (
  messages: AiChatMessage[],
  petId?: string,
): Promise<string> => {
  const { data } = await api.post<{ data: { reply: string } }>('/ai/chat', {
    messages,
    petId,
  });
  return data.data.reply;
};

/**
 * Analyze a pet photo for breed detection and health indicators.
 */
export const analyzePetPhoto = async (
  imageUri: string,
): Promise<{ breed?: string; healthIndicators: string[] }> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'pet_photo.jpg',
  } as unknown as Blob);

  const { data } = await api.post<{
    data: { breed?: string; healthIndicators: string[] };
  }>('/ai/analyze-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
};
