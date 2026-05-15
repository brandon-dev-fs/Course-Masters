import { vi } from 'vitest';

/**
 * Minimal stub for authClient — covers only the methods AuthContext
 * and authClient consumers call.
 *
 * Prevents accidental calls to http://localhost:5002 from AuthProvider's
 * getSession() during component tests.
 *
 * Usage in a test file (top-level, before any describe block):
 *   vi.mock('../../api/auth.js', () => ({ authClient: authClientMock }))
 */
export function createAuthContextValue() {
  return {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: {
      email: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    signUp: {
      email: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    signOut: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

export const authClientMock = createAuthContextValue();
