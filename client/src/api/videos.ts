import { apiClient } from './client.js';
import type { Video } from './types.js';

export const videosApi = {
  getAll: (lessonId: string) => apiClient.get<Video[]>(`/lessons/${lessonId}/videos`),
  create: (lessonId: string, data: { title: string; url: string; order: number }) =>
    apiClient.post<Video>(`/lessons/${lessonId}/videos`, data),
  update: (id: string, data: { title?: string; url?: string; order?: number }) =>
    apiClient.put<Video>(`/videos/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/videos/${id}`),
  fetchTitle: (url: string) => apiClient.get<{ title: string }>(`/youtube/title?url=${encodeURIComponent(url)}`),
};
