import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { linkApi } from '../../api/link.js';

describe('linkApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkEmbed', () => {
    it('calls apiClient.get with the check-embed path', async () => {
      apiClientMock.get.mockResolvedValue({ canEmbed: true });
      await linkApi.checkEmbed('https://example.com');
      expect(apiClientMock.get).toHaveBeenCalledWith(
        expect.stringContaining('/link/check-embed'),
      );
    });

    it('includes the url as a query parameter', async () => {
      apiClientMock.get.mockResolvedValue({ canEmbed: true });
      await linkApi.checkEmbed('https://example.com');
      const [calledUrl] = apiClientMock.get.mock.calls[0] as [string];
      expect(calledUrl).toContain('url=');
    });

    it('encodes the url query parameter', async () => {
      apiClientMock.get.mockResolvedValue({ canEmbed: false });
      const rawUrl = 'https://example.com/path?q=1&r=2';
      await linkApi.checkEmbed(rawUrl);
      const [calledUrl] = apiClientMock.get.mock.calls[0] as [string];
      expect(calledUrl).toContain(encodeURIComponent(rawUrl));
    });

    it('returns canEmbed: true when server responds true', async () => {
      apiClientMock.get.mockResolvedValue({ canEmbed: true });
      const result = await linkApi.checkEmbed('https://example.com');
      expect(result).toEqual({ canEmbed: true });
    });

    it('returns canEmbed: false when server responds false', async () => {
      apiClientMock.get.mockResolvedValue({ canEmbed: false });
      const result = await linkApi.checkEmbed('https://blocked.com');
      expect(result.canEmbed).toBe(false);
    });
  });
});
