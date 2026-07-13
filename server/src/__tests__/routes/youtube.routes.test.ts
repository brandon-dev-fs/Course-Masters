/**
 * Tests for youtube.routes.ts — exercises the inline /title handler logic.
 *
 * fetch is stubbed globally so no real network calls are made.
 * The asyncHandler-wrapped handler is extracted from the router stack and
 * called directly with mock req/res/next objects.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

// Stub global fetch before importing the router
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// asyncHandler dependency — import the real implementation so the handler works
import youtubeRouter from '../../routes/youtube.routes.js';

// Extract the asyncHandler-wrapped handler from the router stack
// stack[0] → Layer for GET /title → route.stack[0].handle
function getHandler() {
  const stack = (youtubeRouter as unknown as { stack: Array<{ route: { stack: Array<{ handle: Function }> } }> }).stack;
  return stack[0].route.stack[0].handle;
}

async function callHandler(req: ReturnType<typeof makeReq>) {
  const handler = getHandler();
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  return { res, next };
}

describe('youtubeRouter GET /title', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws AppError 422 when url query param is missing', async () => {
    const req = makeReq({ query: {} });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 422, code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws AppError 422 when url is not a valid YouTube URL', async () => {
    const req = makeReq({ query: { url: 'https://example.com/not-youtube' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 422, code: 'VALIDATION_ERROR' }),
    );
  });

  it('returns title for valid YouTube watch URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'My Great Video' }),
    });
    const req = makeReq({ query: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
    const { res, next } = await callHandler(req);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ title: 'My Great Video' });
  });

  it('returns title for valid youtu.be shortened URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Short URL Video' }),
    });
    const req = makeReq({ query: { url: 'https://youtu.be/dQw4w9WgXcQ' } });
    const { res, next } = await callHandler(req);
    expect(res.json).toHaveBeenCalledWith({ title: 'Short URL Video' });
  });

  it('throws YOUTUBE_ERROR when oembed fetch returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const req = makeReq({ query: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'YOUTUBE_ERROR', statusCode: 422 }),
    );
  });

  it('calls fetch with oEmbed URL encoding the video URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ title: 'Test' }),
    });
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const req = makeReq({ query: { url: videoUrl } });
    await callHandler(req);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(videoUrl)),
    );
  });
});
