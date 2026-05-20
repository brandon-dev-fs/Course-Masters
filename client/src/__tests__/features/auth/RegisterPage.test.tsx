const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
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
import RegisterPage from '../../../features/auth/RegisterPage.js';
import { makeStudentUser } from '../../mocks/authContext.mock.js';

function fillForm({
  name = 'Alice',
  email = 'alice@test.com',
  password = 'password123',
  confirmPassword = 'password123',
} = {}) {
  fireEvent.change(screen.getByLabelText(/^name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: confirmPassword } });
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    authClientMock.signUp.email.mockResolvedValue({ data: { user: null }, error: null });
  });

  it('renders without crashing', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('heading', { name: /course masters/i })).toBeInTheDocument();
  });

  it('shows name, email, and password fields', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows the create account button', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows a link to the login page', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows passwords do not match error when passwords differ', async () => {
    renderWithProviders(<RegisterPage />);
    fillForm({ password: 'password123', confirmPassword: 'different456' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('calls signUp with entered credentials on valid submit', async () => {
    authClientMock.signUp.email.mockResolvedValueOnce({
      data: { user: makeStudentUser() },
      error: null,
    });
    renderWithProviders(<RegisterPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(authClientMock.signUp.email).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@test.com',
        password: 'password123',
      });
    });
  });

  it('shows error when register returns an error', async () => {
    authClientMock.signUp.email.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email already in use' },
    });
    renderWithProviders(<RegisterPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
  });

  it('shows generic error on non-Error rejection', async () => {
    authClientMock.signUp.email.mockRejectedValueOnce('network error');
    renderWithProviders(<RegisterPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });

  it('shows Creating account while submitting', async () => {
    let resolveSignUp!: (v: unknown) => void;
    authClientMock.signUp.email.mockReturnValueOnce(
      new Promise(res => { resolveSignUp = res; }),
    );
    renderWithProviders(<RegisterPage />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/creating account/i)).toBeInTheDocument();
    resolveSignUp({ data: { user: null }, error: null });
  });
});
