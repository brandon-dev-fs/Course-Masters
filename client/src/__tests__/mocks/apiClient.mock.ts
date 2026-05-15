import { vi } from 'vitest';

/**
 * A vi.fn() stub for every apiClient method.
 * All methods resolve to undefined by default.
 * Override per-test: apiClientMock.get.mockResolvedValue({ ... })
 *
 * Usage in a test file (top-level, before any describe block):
 *   vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }))
 */
export function createApiClientMock() {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    patch: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

export const apiClientMock = createApiClientMock();
