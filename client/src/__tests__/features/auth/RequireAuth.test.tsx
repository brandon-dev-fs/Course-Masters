import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RequireAuth from '../../../features/auth/RequireAuth.js';
import { makeAuthContext, makeStudentUser } from '../../mocks/authContext.mock.js';

vi.mock('/src/context/AuthContext.js', () => ({ useAuth: vi.fn() }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, Navigate: () => null };
});

import { useAuth } from '../../../context/AuthContext.js';

describe('RequireAuth', () => {
  it('shows loading spinner while session is loading', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuthContext({ isLoading: true, user: null }));
    render(
      <MemoryRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is null and not loading', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuthContext({ isLoading: false, user: null }));
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </MemoryRouter>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuthContext({ isLoading: false, user: makeStudentUser() }));
    render(
      <MemoryRouter>
        <RequireAuth>
          <div>Protected Content</div>
        </RequireAuth>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
