const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../components/RichTextEditor.js', () => ({ default: () => null }));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.js';

// We need to render App inside a MemoryRouter since App uses Routes.
// But App itself uses Routes which requires a Router. We wrap in MemoryRouter.

function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  it('renders without crashing', () => {
    const { container } = renderApp('/login');
    expect(container).toBeTruthy();
  });

  it('renders login page at /login route', async () => {
    renderApp('/login');
    expect(await screen.findByText('Sign in to your account')).toBeInTheDocument();
  });

  it('renders register page at /register route', async () => {
    renderApp('/register');
    expect(await screen.findByText(/create account/i)).toBeInTheDocument();
  });
});
