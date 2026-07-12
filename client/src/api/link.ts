import { apiClient } from './client.js';

export const linkApi = {
  checkEmbed: (url: string): Promise<{ canEmbed: boolean }> =>
    apiClient.get(`/link/check-embed?url=${encodeURIComponent(url)}`),
};
