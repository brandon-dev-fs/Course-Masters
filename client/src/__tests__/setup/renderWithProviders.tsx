import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext.js';

interface RenderOptions {
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
