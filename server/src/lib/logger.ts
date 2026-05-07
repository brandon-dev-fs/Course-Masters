import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: [
      'password',
      'token',
      'secret',
      'authorization',
      '*.password',
      '*.token',
      '*.secret',
      '*.authorization',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
});
