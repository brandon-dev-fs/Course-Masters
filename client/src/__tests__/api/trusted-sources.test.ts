import { describe, it, expect, beforeEach, vi } from 'vitest';

const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api/client.js', () => ({ apiClient: apiClientMock }));

import { trustedSourcesApi } from '../../api/trusted-sources.js';
import type { TrustedSource } from '../../api/types.js';

const mockSource: TrustedSource = {
  id: 'ts1',
  name: 'Khan Academy',
  domain: 'khanacademy.org',
  contentTypes: ['video', 'reading'],
  categories: ['math', 'science'],
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('trustedSourcesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /admin/trusted-sources without query when active is undefined', async () => {
      apiClientMock.get.mockResolvedValueOnce([mockSource]);
      const result = await trustedSourcesApi.getAll();
      expect(apiClientMock.get).toHaveBeenCalledWith('/admin/trusted-sources');
      expect(result).toEqual([mockSource]);
    });

    it('calls GET /admin/trusted-sources?active=true when active=true', async () => {
      apiClientMock.get.mockResolvedValueOnce([mockSource]);
      await trustedSourcesApi.getAll(true);
      expect(apiClientMock.get).toHaveBeenCalledWith('/admin/trusted-sources?active=true');
    });

    it('calls GET /admin/trusted-sources?active=false when active=false', async () => {
      apiClientMock.get.mockResolvedValueOnce([]);
      const result = await trustedSourcesApi.getAll(false);
      expect(apiClientMock.get).toHaveBeenCalledWith('/admin/trusted-sources?active=false');
      expect(result).toEqual([]);
    });

    it('returns an empty array when no sources exist', async () => {
      apiClientMock.get.mockResolvedValueOnce([]);
      const result = await trustedSourcesApi.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('calls POST /admin/trusted-sources with the provided data', async () => {
      const payload = {
        name: 'Khan Academy',
        domain: 'khanacademy.org',
        contentTypes: ['video'],
        categories: ['math'],
      };
      apiClientMock.post.mockResolvedValueOnce(mockSource);
      const result = await trustedSourcesApi.create(payload);
      expect(apiClientMock.post).toHaveBeenCalledWith('/admin/trusted-sources', payload);
      expect(result).toEqual(mockSource);
    });

    it('passes empty arrays for contentTypes and categories', async () => {
      const payload = { name: 'MDN', domain: 'developer.mozilla.org', contentTypes: [], categories: [] };
      apiClientMock.post.mockResolvedValueOnce({ ...mockSource, ...payload });
      await trustedSourcesApi.create(payload);
      expect(apiClientMock.post).toHaveBeenCalledWith('/admin/trusted-sources', payload);
    });
  });

  describe('update', () => {
    it('calls PUT /admin/trusted-sources/:id with update data', async () => {
      const updates = { name: 'Khan Academy Updated' };
      const updated = { ...mockSource, name: 'Khan Academy Updated' };
      apiClientMock.put.mockResolvedValueOnce(updated);
      const result = await trustedSourcesApi.update('ts1', updates);
      expect(apiClientMock.put).toHaveBeenCalledWith('/admin/trusted-sources/ts1', updates);
      expect(result).toEqual(updated);
    });

    it('can reactivate a source by updating active to true', async () => {
      const reactivated = { ...mockSource, active: true };
      apiClientMock.put.mockResolvedValueOnce(reactivated);
      const result = await trustedSourcesApi.update('ts1', { active: true });
      expect(apiClientMock.put).toHaveBeenCalledWith('/admin/trusted-sources/ts1', { active: true });
      expect(result.active).toBe(true);
    });

    it('uses the correct sourceId in the URL', async () => {
      apiClientMock.put.mockResolvedValueOnce(mockSource);
      await trustedSourcesApi.update('different-id', { domain: 'example.com' });
      expect(apiClientMock.put).toHaveBeenCalledWith(
        '/admin/trusted-sources/different-id',
        { domain: 'example.com' },
      );
    });
  });

  describe('deactivate', () => {
    it('calls DELETE /admin/trusted-sources/:id', async () => {
      apiClientMock.delete.mockResolvedValueOnce(undefined);
      const result = await trustedSourcesApi.deactivate('ts1');
      expect(apiClientMock.delete).toHaveBeenCalledWith('/admin/trusted-sources/ts1');
      expect(result).toBeUndefined();
    });

    it('uses the correct sourceId in the URL', async () => {
      apiClientMock.delete.mockResolvedValueOnce(undefined);
      await trustedSourcesApi.deactivate('another-id');
      expect(apiClientMock.delete).toHaveBeenCalledWith('/admin/trusted-sources/another-id');
    });
  });
});
