import { pinoHttp } from 'pino-http';
import { IncomingMessage, ServerResponse } from 'http';
import { logger } from '../lib/logger.js';

export const httpLogger = pinoHttp({
  logger,

  // Reuse the requestId already set by requestIdMiddleware for log correlation
  genReqId: (req: IncomingMessage) => (req as unknown as Record<string, string>)['requestId'],

  // Serializers: suppress req.body on auth routes at the serializer level (FR-04)
  serializers: {
    req(req: IncomingMessage & { url?: string; method?: string; id?: unknown; raw?: IncomingMessage & { body?: unknown } }) {
      const base = {
        id: req.id,
        method: req.method,
        url: req.url,
      };
      // Do not log body for auth routes (FR-04)
      if (req.url?.startsWith('/api/auth/')) {
        return base;
      }
      return { ...base, body: req.raw?.body };
    },
    res(res: ServerResponse & { statusCode: number }) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});
