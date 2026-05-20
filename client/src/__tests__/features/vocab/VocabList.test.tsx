const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import VocabList from '../../../features/vocab/VocabList.js';

describe('VocabList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    renderWithProviders(<VocabList lessonId="l1" />);
    expect(await screen.findByText(/no vocabulary yet/i)).toBeInTheDocument();
  });

  it('shows vocab cards when data is available', async () => {
    apiClientMock.get.mockResolvedValue([
      { id: 't1', type: 'vocab', title: 'Variable', content: { term: 'Variable', definition: 'A name in memory' }, order: 1, lessonId: 'l1', isRequired: false },
    ]);
    renderWithProviders(<VocabList lessonId="l1" />);
    expect(await screen.findByText('Variable')).toBeInTheDocument();
  });
});
