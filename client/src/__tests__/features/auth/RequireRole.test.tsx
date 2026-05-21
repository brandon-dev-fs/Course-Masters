import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RequireRole from '../../../features/auth/RequireRole.js';
import { AuthContext } from '../../../context/AuthContext.js';
import { makeAuthContext, makeStudentUser, makeTeacherUser, makeAdminUser } from '../../mocks/authContext.mock.js';

describe('RequireRole', () => {
  it('shows access denied when user is null', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: null })}>
          <RequireRole roles={['admin']}>
            <div>Admin Content</div>
          </RequireRole>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('shows access denied when user role does not match', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: makeStudentUser() })}>
          <RequireRole roles={['admin', 'teacher']}>
            <div>Teacher Content</div>
          </RequireRole>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Content')).not.toBeInTheDocument();
  });

  it('renders children when user role matches', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: makeAdminUser() })}>
          <RequireRole roles={['admin']}>
            <div>Admin Content</div>
          </RequireRole>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('renders children when teacher role is in allowed roles', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: makeTeacherUser() })}>
          <RequireRole roles={['admin', 'teacher']}>
            <div>Teacher Content</div>
          </RequireRole>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Teacher Content')).toBeInTheDocument();
  });

  it('shows a go home link on access denied', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: null })}>
          <RequireRole roles={['admin']}>
            <div>Content</div>
          </RequireRole>
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
  });
});
