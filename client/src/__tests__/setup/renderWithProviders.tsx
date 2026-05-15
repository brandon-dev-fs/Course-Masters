import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.js';
import type { AuthUser } from '../../api/types.js';

interface RenderOptions {
  /**
   * Pre-populate the AuthContext user. Achieved by controlling what
   * authClientMock.getSession resolves to before the component mounts.
   * Default: null (no session).
   *
   * Note: renderWithProviders renders the real AuthProvider. The user value
   * is not injected directly — it is determined by what authClientMock.getSession
   * returns. Override getSession in your test before calling renderWithProviders:
   *   authClientMock.getSession.mockResolvedValue({ data: { user: myUser }, error: null })
   *
   * If you need a synchronous, predetermined auth state without waiting for
   * getSession to resolve, render a lightweight AuthContext.Provider directly
   * with a makeAuthContext() value instead of using this helper.
   */
  user?: AuthUser | null;
  /** Pre-populated AuthContext isLoading value (for future use). */
  isLoading?: boolean;
  /** MemoryRouter initialEntries[0]. Default: '/' */
  initialRoute?: string;
}

/**
 * Wraps any component or hook under test in the full provider tree that
 * components in this codebase rely on (AuthProvider + MemoryRouter).
 *
 * Prerequisites:
 * - The authClient module must be mocked (vi.mock) before this is called so
 *   AuthProvider's getSession does not hit localhost:5002.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {},
) {
  const { initialRoute = '/' } = options;
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
