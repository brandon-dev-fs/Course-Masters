import { apiClient } from './client.js';
import type { FlashCard } from './types.js';

export const flashCardsApi = {
  getAll: (lessonId: string) => apiClient.get<FlashCard[]>(`/lessons/${lessonId}/flashcards`),
  create: (lessonId: string, data: { front: string; back: string; order: number }) =>
    apiClient.post<FlashCard>(`/lessons/${lessonId}/flashcards`, data),
  update: (id: string, data: { front?: string; back?: string; order?: number }) =>
    apiClient.put<FlashCard>(`/flashcards/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/flashcards/${id}`),
};
