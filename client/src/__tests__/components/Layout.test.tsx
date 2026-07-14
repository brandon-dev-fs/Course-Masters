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
import { makeStudentUser, makeAdminUser } from '../mocks/authContext.mock.js';
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

  it('shows user name when a student is logged in', async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: makeStudentUser() },
      error: null,
    });
    renderWithProviders(<Layout />);
    expect(await screen.findByText('Student')).toBeInTheDocument();
  });

  it('shows sign out button when user is logged in', async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: makeStudentUser() },
      error: null,
    });
    renderWithProviders(<Layout />);
    expect(await screen.findByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('shows admin links when user has admin role', async () => {
    authClientMock.getSession.mockResolvedValue({
      data: { user: makeAdminUser() },
      error: null,
    });
    renderWithProviders(<Layout />);
    expect(await screen.findByRole('link', { name: /admin users/i })).toBeInTheDocument();
  });

  it('renders the hamburger menu button', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByRole('button', { name: /open navigation menu/i })).toBeInTheDocument();
  });
});
