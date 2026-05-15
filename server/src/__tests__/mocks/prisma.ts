import { vi } from 'vitest';

/**
 * Creates a deep Proxy where every property access returns a vi.fn() stub.
 * The same fn is returned for repeated access of the same key chain, so
 * callers can configure return values with .mockResolvedValue() etc.
 */
function createModelProxy(): Record<string, ReturnType<typeof vi.fn>> {
  const methods: Record<string, ReturnType<typeof vi.fn>> = {};
  return new Proxy(methods, {
    get(target, prop: string) {
      if (!(prop in target)) {
        target[prop] = vi.fn();
      }
      return target[prop];
    },
  });
}

/**
 * A deep Proxy that returns a model-level proxy for every model name accessed.
 * Usage:
 *   prismaMock.assessment.findFirst.mockResolvedValue({ ... })
 *
 * In each test file that needs it, add at the top level:
 *   vi.mock('../../lib/prisma.js', () => ({ default: prismaMock }))
 */
function createPrismaProxy() {
  const models: Record<string, ReturnType<typeof createModelProxy>> = {};

  const proxy = new Proxy(models, {
    get(target, prop: string) {
      // Handle $transaction specially: execute callback with a fresh proxy
      if (prop === '$transaction') {
        return vi.fn((callback: (tx: typeof proxy) => Promise<unknown>) => {
          return callback(createPrismaProxy());
        });
      }
      if (!(prop in target)) {
        target[prop] = createModelProxy();
      }
      return target[prop];
    },
  });

  return proxy;
}

export const prismaMock = createPrismaProxy();
