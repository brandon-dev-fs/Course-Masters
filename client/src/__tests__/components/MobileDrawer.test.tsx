const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../api/auth.js', () => ({ authClient: authClientMock }));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createRef } from 'react';
import { AuthContext } from '../../context/AuthContext.js';
import { ThemeProvider } from '../../context/ThemeContext.js';
import { makeAuthContext, makeStudentUser, makeAdminUser } from '../mocks/authContext.mock.js';
import MobileDrawer from '../../components/MobileDrawer.js';

function renderDrawer(
  isOpen: boolean,
  authOverrides?: Parameters<typeof makeAuthContext>[0],
  initialRoute = '/',
) {
  const onClose = vi.fn();
  const focusReturnRef = createRef<HTMLButtonElement>();

  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <AuthContext.Provider value={makeAuthContext(authOverrides)}>
          <MobileDrawer
            isOpen={isOpen}
            onClose={onClose}
            focusReturnRef={focusReturnRef}
          />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  );

  return { onClose };
}

describe('MobileDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      renderDrawer(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the drawer panel when isOpen is true', () => {
      renderDrawer(true);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('dismissal', () => {
    it('calls onClose when Escape key is pressed', () => {
      const { onClose } = renderDrawer(true);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when the backdrop is clicked', () => {
      const { onClose } = renderDrawer(true);
      // The backdrop is aria-hidden and immediately before the dialog
      const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when the close button is clicked', () => {
      const { onClose } = renderDrawer(true);
      fireEvent.click(screen.getByRole('button', { name: /close navigation menu/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('unauthenticated nav items', () => {
    it('shows Sign In and Sign Up links when user is null', () => {
      renderDrawer(true, { user: null });
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('does not show Profile or Sign Out when user is null', () => {
      renderDrawer(true, { user: null });
      expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    });
  });

  describe('authenticated nav items', () => {
    it('shows Profile link and Sign Out button when user is authenticated', () => {
      renderDrawer(true, { user: makeStudentUser() });
      expect(screen.getByRole('link', { name: /student/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('does not show Sign In or Sign Up when user is authenticated', () => {
      renderDrawer(true, { user: makeStudentUser() });
      expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
    });

    it('does not show Admin link for non-admin users', () => {
      renderDrawer(true, { user: makeStudentUser() });
      expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
    });

    it('shows Admin link for admin users', () => {
      renderDrawer(true, { user: makeAdminUser() });
      const adminLinks = screen.getAllByRole('link', { name: /admin/i });
      expect(adminLinks.length).toBeGreaterThan(0);
    });
  });

  describe('theme toggle', () => {
    it('always renders the theme toggle button', () => {
      renderDrawer(true, { user: null });
      expect(
        screen.getByRole('button', { name: /cycle theme/i }),
      ).toBeInTheDocument();
    });

    it('shows current theme preference label in the button text', () => {
      localStorage.setItem('themePreference', 'light');
      renderDrawer(true, { user: null });
      expect(screen.getByText(/light mode/i)).toBeInTheDocument();
      localStorage.removeItem('themePreference');
    });
  });

  describe('sign out', () => {
    it('calls logout when Sign Out is clicked', async () => {
      const logoutMock = vi.fn().mockResolvedValue(undefined);
      renderDrawer(true, { user: makeStudentUser(), logout: logoutMock });
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
      expect(logoutMock).toHaveBeenCalledOnce();
    });
  });

  describe('active route', () => {
    it('marks the Sign In link as aria-current="page" when on /login', () => {
      renderDrawer(true, { user: null }, '/login');
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('marks the Sign Up link as aria-current="page" when on /register', () => {
      renderDrawer(true, { user: null }, '/register');
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('marks the Profile link as aria-current="page" when on /profile', () => {
      renderDrawer(true, { user: makeStudentUser() }, '/profile');
      expect(screen.getByRole('link', { name: makeStudentUser().name })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('marks the Admin link as aria-current="page" when on /admin/users', () => {
      renderDrawer(true, { user: makeAdminUser() }, '/admin/users');
      const adminNavLink = screen
        .getAllByRole('link', { name: 'Admin' })
        .find((l) => l.getAttribute('href') === '/admin/users');
      expect(adminNavLink).toHaveAttribute('aria-current', 'page');
    });
  });
});
