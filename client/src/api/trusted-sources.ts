import { apiClient } from './client.js';

import type { TrustedSource } from './types.js';

interface CreateTrustedSourceInput {
  name: string;
  domain: string;
  contentTypes: string[];
  categories: string[];
}

interface UpdateTrustedSourceInput {
  name?: string;
  domain?: string;
  contentTypes?: string[];
  categories?: string[];
  active?: boolean;
}

export const trustedSourcesApi = {
  getAll(active?: boolean): Promise<TrustedSource[]> {
    const query = active !== undefined ? `?active=${String(active)}` : '';
    return apiClient.get<TrustedSource[]>(`/admin/trusted-sources${query}`);
  },

  create(data: CreateTrustedSourceInput): Promise<TrustedSource> {
    return apiClient.post<TrustedSource>('/admin/trusted-sources', data);
  },

  update(id: string, data: UpdateTrustedSourceInput): Promise<TrustedSource> {
    return apiClient.put<TrustedSource>(`/admin/trusted-sources/${id}`, data);
  },

  deactivate(id: string): Promise<void> {
    return apiClient.delete<void>(`/admin/trusted-sources/${id}`);
  },
};
