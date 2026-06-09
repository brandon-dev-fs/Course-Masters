const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../api/auth.js', () => ({ authClient: authClientMock }));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../setup/renderWithProviders.js';
import Layout from '../../components/Layout.js';

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  it('renders the brand name in the header', async () => {
    renderWithProviders(<Layout />);
    expect(screen.getAllByText('Course Masters').length).toBeGreaterThan(0);
  });

  it('shows Sign In and Sign Up links when no user', async () => {
    renderWithProviders(<Layout />);
    expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders the footer', async () => {
    renderWithProviders(<Layout />);
    expect(await screen.findByRole('contentinfo')).toBeInTheDocument();
  });
});
