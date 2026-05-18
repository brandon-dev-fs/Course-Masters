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
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock, ApiClientError: class ApiClientError extends Error {}, classifyError: (e: unknown) => String(e) }));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import HomePage from '../../../features/home/HomePage.js';

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClientMock.get.mockResolvedValue([]);
  });

  it('renders without crashing when no user (guest view)', async () => {
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    renderWithProviders(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders course list heading when logged in as teacher', async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: { id: 'u1', name: 'T', email: 't@t.com', role: 'teacher', emailVerified: true }, session: {} },
      error: null,
    });
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('My Courses')).toBeInTheDocument();
  });

  it('shows empty state when no courses exist', async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: { id: 'u1', name: 'T', email: 't@t.com', role: 'teacher', emailVerified: true }, session: {} },
      error: null,
    });
    apiClientMock.get.mockResolvedValue([]);
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('No courses yet')).toBeInTheDocument();
  });
});
