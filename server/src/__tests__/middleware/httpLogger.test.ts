import { describe, it, expect, vi } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'http';

// Use vi.hoisted so capturedOpts is available inside the vi.mock factory,
// which is hoisted to the top of the file before variable declarations.
const { capturedOptsRef } = vi.hoisted(() => {
  const capturedOptsRef: { current: Record<string, unknown> } = { current: {} };
  return { capturedOptsRef };
});

vi.mock('pino-http', () => ({
  pinoHttp: vi.fn((opts: Record<string, unknown>) => {
    capturedOptsRef.current = opts;
    return vi.fn(); // middleware stub
  }),
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { httpLogger } from '../../middleware/httpLogger.js';

describe('httpLogger', () => {
  it('exports httpLogger as a function (middleware)', () => {
    expect(typeof httpLogger).toBe('function');
  });

  describe('genReqId', () => {
    it('returns the requestId already set on the request', () => {
      const genReqId = capturedOptsRef.current['genReqId'] as (req: unknown) => string;
      const fakeReq = { requestId: 'test-req-id-123' };
      expect(genReqId(fakeReq)).toBe('test-req-id-123');
    });

    it('returns undefined when requestId is not set', () => {
      const genReqId = capturedOptsRef.current['genReqId'] as (req: unknown) => string | undefined;
      expect(genReqId({})).toBeUndefined();
    });
  });

  describe('serializers.req', () => {
    it('returns id, method, url for non-auth routes', () => {
      const serializers = capturedOptsRef.current['serializers'] as {
        req: (req: IncomingMessage & { url?: string; method?: string; id?: unknown }) => unknown;
      };
      const fakeReq = { id: 'req-1', method: 'GET', url: '/api/courses' };
      const result = serializers.req(fakeReq as unknown as IncomingMessage) as Record<string, unknown>;
      expect(result['id']).toBe('req-1');
      expect(result['method']).toBe('GET');
      expect(result['url']).toBe('/api/courses');
    });

    it('does not include body field for any route', () => {
      const serializers = capturedOptsRef.current['serializers'] as {
        req: (req: IncomingMessage & { url?: string; method?: string; id?: unknown }) => unknown;
      };
      const fakeReq = { id: 'req-2', method: 'POST', url: '/api/courses', body: { secret: 'value' } };
      const result = serializers.req(fakeReq as unknown as IncomingMessage) as Record<string, unknown>;
      expect(result).not.toHaveProperty('body');
    });

    it('returns minimal fields for auth routes', () => {
      const serializers = capturedOptsRef.current['serializers'] as {
        req: (req: IncomingMessage & { url?: string; method?: string; id?: unknown }) => unknown;
      };
      const fakeReq = { id: 'req-3', method: 'POST', url: '/api/auth/sign-in/email' };
      const result = serializers.req(fakeReq as unknown as IncomingMessage) as Record<string, unknown>;
      expect(result['id']).toBe('req-3');
      expect(result['method']).toBe('POST');
      expect(result['url']).toBe('/api/auth/sign-in/email');
      expect(result).not.toHaveProperty('body');
    });
  });

  describe('serializers.res', () => {
    it('returns statusCode for successful responses', () => {
      const serializers = capturedOptsRef.current['serializers'] as {
        res: (res: ServerResponse & { statusCode: number }) => unknown;
      };
      const fakeRes = { statusCode: 200 };
      const result = serializers.res(fakeRes as unknown as ServerResponse & { statusCode: number }) as Record<string, unknown>;
      expect(result['statusCode']).toBe(200);
    });

    it('returns statusCode for error responses', () => {
      const serializers = capturedOptsRef.current['serializers'] as {
        res: (res: ServerResponse & { statusCode: number }) => unknown;
      };
      const fakeRes = { statusCode: 404 };
      const result = serializers.res(fakeRes as unknown as ServerResponse & { statusCode: number }) as Record<string, unknown>;
      expect(result['statusCode']).toBe(404);
    });
  });
});
