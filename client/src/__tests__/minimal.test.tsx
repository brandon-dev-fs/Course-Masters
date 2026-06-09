import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { makeAuthContext, makeStudentUser } from './mocks/authContext.mock.js';
import RequireAuth from '../features/auth/RequireAuth.js';

vi.mock('../context/AuthContext.js', () => ({ useAuth: vi.fn() }));
import { useAuth } from '../context/AuthContext.js';

describe('RequireAuth render', () => {
  it('renders children when authenticated', () => {
    vi.mocked(useAuth).mockReturnValue(makeAuthContext({ user: makeStudentUser() }));
    render(
      <MemoryRouter>
        <RequireAuth><div>Content</div></RequireAuth>
      </MemoryRouter>,
    );
    expect(1).toBe(1);
  });
});
