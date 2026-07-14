/**
 * Tests for link.routes.ts — covers the /check-embed handler and
 * the isPrivateIp helper (exercised indirectly via the route handler).
 *
 * dns.lookup and global fetch are both stubbed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeReq, makeRes, makeNext } from '../mocks/express.js';

// Stub global fetch before importing the router
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// vi.hoisted makes mockLookup available inside the vi.mock factory,
// which is hoisted to the top of the file before variable declarations.
const { mockLookup } = vi.hoisted(() => {
  const mockLookup = vi.fn();
  return { mockLookup };
});

vi.mock('node:dns', () => ({
  promises: { lookup: mockLookup },
}));

import linkRouter from '../../routes/link.routes.js';

// Extract the asyncHandler-wrapped handler from the router stack.
// stack[0] → Layer for GET /check-embed → route.stack[0].handle
function getHandler() {
  const stack = (
    linkRouter as unknown as {
      stack: Array<{ route: { stack: Array<{ handle: Function }> } }>;
    }
  ).stack;
  return stack[0].route.stack[0].handle;
}

async function callHandler(req: ReturnType<typeof makeReq>) {
  const handler = getHandler();
  const res = makeRes();
  const next = makeNext();
  handler(req, res, next);
  // Allow multiple promise microtasks to settle (asyncHandler + async handler)
  for (let i = 0; i < 5; i++) await Promise.resolve();
  return { res, next };
}

function makeOkFetch(headers: Record<string, string | null> = {}) {
  return {
    ok: true,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  };
}

describe('linkRouter GET /check-embed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: public IP, no blocking headers
    mockLookup.mockResolvedValue({ address: '93.184.216.34' });
    mockFetch.mockResolvedValue(makeOkFetch());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── URL validation ──────────────────────────────────────────────────────────

  it('throws VALIDATION_ERROR when url is missing', async () => {
    const req = makeReq({ query: {} });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  it('throws VALIDATION_ERROR when url does not start with http/https', async () => {
    const req = makeReq({ query: { url: 'ftp://example.com' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  // ── DNS failure ─────────────────────────────────────────────────────────────

  it('throws VALIDATION_ERROR when DNS lookup fails', async () => {
    mockLookup.mockRejectedValue(new Error('ENOTFOUND'));
    const req = makeReq({ query: { url: 'https://doesnotexist.example.com/page' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  // ── SSRF guard — private IP rejection ──────────────────────────────────────

  it('rejects loopback 127.x.x.x', async () => {
    mockLookup.mockResolvedValue({ address: '127.0.0.1' });
    const req = makeReq({ query: { url: 'http://localhost/admin' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  it('rejects RFC 1918 10.x.x.x range', async () => {
    mockLookup.mockResolvedValue({ address: '10.0.0.1' });
    const req = makeReq({ query: { url: 'http://internal.example.com/' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  it('rejects RFC 1918 172.16–31.x.x range', async () => {
    mockLookup.mockResolvedValue({ address: '172.16.0.1' });
    const req = makeReq({ query: { url: 'http://internal.example.com/' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  it('rejects RFC 1918 192.168.x.x range', async () => {
    mockLookup.mockResolvedValue({ address: '192.168.1.100' });
    const req = makeReq({ query: { url: 'http://home-router.local/' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  it('rejects link-local 169.254.x.x (cloud metadata endpoint)', async () => {
    mockLookup.mockResolvedValue({ address: '169.254.169.254' });
    const req = makeReq({ query: { url: 'http://metadata.example.com/' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  it('rejects IPv6 loopback ::1', async () => {
    mockLookup.mockResolvedValue({ address: '::1' });
    const req = makeReq({ query: { url: 'http://ipv6-loopback.example.com/' } });
    const { next } = await callHandler(req);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
    );
  });

  // ── canEmbed logic ──────────────────────────────────────────────────────────

  it('returns canEmbed: true when no blocking headers', async () => {
    const req = makeReq({ query: { url: 'https://example.com/page' } });
    const { res, next } = await callHandler(req);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ canEmbed: true });
  });

  it('returns canEmbed: false when X-Frame-Options is DENY', async () => {
    mockFetch.mockResolvedValue(makeOkFetch({ 'x-frame-options': 'DENY' }));
    const req = makeReq({ query: { url: 'https://example.com/page' } });
    const { res } = await callHandler(req);
    expect(res.json).toHaveBeenCalledWith({ canEmbed: false });
  });

  it('returns canEmbed: false when X-Frame-Options is SAMEORIGIN', async () => {
    mockFetch.mockResolvedValue(makeOkFetch({ 'x-frame-options': 'SAMEORIGIN' }));
    const req = makeReq({ query: { url: 'https://example.com/page' } });
    const { res } = await callHandler(req);
    expect(res.json).toHaveBeenCalledWith({ canEmbed: false });
  });

  it('returns canEmbed: false when CSP frame-ancestors is "none"', async () => {
    mockFetch.mockResolvedValue(
      makeOkFetch({ 'content-security-policy': "default-src 'self'; frame-ancestors 'none'" }),
    );
    const req = makeReq({ query: { url: 'https://example.com/page' } });
    const { res } = await callHandler(req);
    expect(res.json).toHaveBeenCalledWith({ canEmbed: false });
  });

  it('returns canEmbed: false when CSP frame-ancestors is "self"', async () => {
    mockFetch.mockResolvedValue(
      makeOkFetch({ 'content-security-policy': "frame-ancestors 'self'" }),
    );
    const req = makeReq({ query: { url: 'https://example.com/page' } });
    const { res } = await callHandler(req);
    expect(res.json).toHaveBeenCalledWith({ canEmbed: false });
  });

  it('returns canEmbed: true when fetch times out (optimistic default)', async () => {
    mockFetch.mockRejectedValue(new Error('AbortError: The operation was aborted'));
    const req = makeReq({ query: { url: 'https://example.com/page' } });
    const { res, next } = await callHandler(req);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ canEmbed: true });
  });

  it('allows public IPs not in private ranges', async () => {
    mockLookup.mockResolvedValue({ address: '8.8.8.8' });
    const req = makeReq({ query: { url: 'https://google.com/' } });
    const { res, next } = await callHandler(req);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ canEmbed: true });
  });
});
