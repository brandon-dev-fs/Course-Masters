const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, Navigate: () => null };
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import LoginPage from '../../../features/auth/LoginPage.js';
import { makeStudentUser } from '../../mocks/authContext.mock.js';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    authClientMock.signIn.email.mockResolvedValue({ data: { user: null }, error: null });
  });

  it('renders without crashing', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { name: /course masters/i })).toBeInTheDocument();
  });

  it('shows email and password inputs', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows the sign in button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows a link to the register page', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('calls signIn with entered credentials on submit', async () => {
    authClientMock.signIn.email.mockResolvedValueOnce({
      data: { user: makeStudentUser() },
      error: null,
    });
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(authClientMock.signIn.email).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('shows error message when login returns an error', async () => {
    authClientMock.signIn.email.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid credentials' },
    });
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows generic error message when login rejects with non-Error', async () => {
    authClientMock.signIn.email.mockRejectedValueOnce('network error');
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });

  it('shows Signing in while submitting', async () => {
    let resolveSignIn!: (v: unknown) => void;
    authClientMock.signIn.email.mockReturnValueOnce(
      new Promise(res => { resolveSignIn = res; }),
    );
    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/signing in/i)).toBeInTheDocument();
    resolveSignIn({ data: { user: null }, error: null });
  });
});
