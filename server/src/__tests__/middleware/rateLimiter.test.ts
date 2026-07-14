import { describe, it, expect, vi } from 'vitest';

// vi.hoisted ensures capturedConfigs is accessible inside the vi.mock factory,
// which is hoisted to the top of the file before let/const declarations.
const { capturedConfigs } = vi.hoisted(() => {
  const capturedConfigs: Array<Record<string, unknown>> = [];
  return { capturedConfigs };
});

vi.mock('express-rate-limit', () => ({
  default: vi.fn((config: Record<string, unknown>) => {
    capturedConfigs.push(config);
    return vi.fn(); // stub middleware
  }),
}));

import { authLimiter, apiLimiter } from '../../middleware/rateLimiter.js';

describe('rateLimiter', () => {
  it('exports authLimiter as a function', () => {
    expect(typeof authLimiter).toBe('function');
  });

  it('exports apiLimiter as a function', () => {
    expect(typeof apiLimiter).toBe('function');
  });

  it('authLimiter uses a 15-minute window', () => {
    expect(capturedConfigs[0]['windowMs']).toBe(15 * 60 * 1000);
  });

  it('authLimiter allows max 20 requests', () => {
    expect(capturedConfigs[0]['max']).toBe(20);
  });

  it('apiLimiter uses a 15-minute window', () => {
    expect(capturedConfigs[1]['windowMs']).toBe(15 * 60 * 1000);
  });

  it('apiLimiter allows max 300 requests', () => {
    expect(capturedConfigs[1]['max']).toBe(300);
  });

  it('both limiters enable standardHeaders and disable legacyHeaders', () => {
    for (const config of capturedConfigs) {
      expect(config['standardHeaders']).toBe(true);
      expect(config['legacyHeaders']).toBe(false);
    }
  });

  it('rate limit error message uses RATE_LIMITED code', () => {
    for (const config of capturedConfigs) {
      const msg = config['message'] as { error: { code: string } };
      expect(msg.error.code).toBe('RATE_LIMITED');
    }
  });
});
