import { vi } from 'vitest';

/**
 * Returns a vi.fn() mock for useNavigate's returned navigate function.
 *
 * Usage:
 *   const navigateMock = createNavigateMock();
 *   vi.mock('react-router-dom', async (importOriginal) => {
 *     const actual = await importOriginal<typeof import('react-router-dom')>();
 *     return { ...actual, useNavigate: () => navigateMock };
 *   });
 */
export function createNavigateMock() {
  return vi.fn();
}
