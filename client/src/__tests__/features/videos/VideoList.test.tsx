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
import VideoList from '../../../features/videos/VideoList.js';

describe('VideoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
  });

  it('renders without crashing with empty list', async () => {
    renderWithProviders(<VideoList lessonId="l1" />);
    expect(await screen.findByText(/no videos yet/i)).toBeInTheDocument();
  });

  it('shows a video card when data exists', async () => {
    apiClientMock.get.mockResolvedValue([
      { id: 'r1', type: 'video', title: 'Python Intro', content: { url: 'https://youtube.com/watch?v=abc' }, order: 1, lessonId: 'l1', isRequired: false },
    ]);
    renderWithProviders(<VideoList lessonId="l1" />);
    expect(await screen.findByText('Python Intro')).toBeInTheDocument();
  });
});
