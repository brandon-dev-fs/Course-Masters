import { apiClient } from './client.js';

import type { UpdatePreferencesInput, UpdatePreferencesResponse, UserProfile } from './types.js';

export const usersApi = {
  getMe: () => apiClient.get<UserProfile>('/users/me'),
  updatePreferences: (body: UpdatePreferencesInput) =>
    apiClient.patch<UpdatePreferencesResponse>('/users/me/preferences', body),
};
