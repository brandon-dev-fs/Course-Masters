import pino from 'pino';
import { config } from '../config.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    // NOTE: pino lacks deep wildcard support (no '**' glob). Single-level wildcards
    // (e.g. '*.password') catch one nesting level only. Any new nested sensitive
    // field must be added here explicitly as a belt-and-suspenders guard.
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
      // Explicit nested paths for fields pino single-level wildcards may miss
      'req.body.password',
      'req.body.token',
      'req.body.secret',
      'req.body.authorization',
      'req.session.token',
    ],
    censor: '[REDACTED]',
  },
});
