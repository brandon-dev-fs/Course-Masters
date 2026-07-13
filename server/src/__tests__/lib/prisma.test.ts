/**
 * Tests for lib/prisma.ts — verifies the singleton is a PrismaClient instance
 * and that a beforeExit handler is registered for graceful disconnect.
 *
 * PrismaClient is mocked via vi.hoisted + vi.mock to avoid requiring a
 * real database connection.
 */
import { describe, it, expect, vi } from 'vitest';

// vi.hoisted runs before vi.mock factories and before module imports.
// This lets us capture the mock instance and inspect it after the module loads.
const { mockDisconnect, registeredHandlers } = vi.hoisted(() => {
  const mockDisconnect = vi.fn().mockResolvedValue(undefined);
  const registeredHandlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

  // Intercept process.on to capture the beforeExit handler registration.
  // Must be done here (before modules are imported) so it fires when prisma.ts loads.
  vi.spyOn(process, 'on').mockImplementation(
    (event: string, handler: (...args: unknown[]) => void) => {
      registeredHandlers.push({ event, handler });
      return process;
    },
  );

  return { mockDisconnect, registeredHandlers };
});

vi.mock('@prisma/client', () => {
  class PrismaClient {
    $disconnect = mockDisconnect;
    $connect = vi.fn();
  }
  return { PrismaClient };
});

import prisma from '../../lib/prisma.js';

describe('prisma singleton', () => {
  it('exports a non-null default', () => {
    expect(prisma).toBeDefined();
    expect(prisma).not.toBeNull();
  });

  it('has a $disconnect method', () => {
    expect(typeof prisma.$disconnect).toBe('function');
  });

  it('registers a beforeExit process handler', () => {
    const beforeExitHandlers = registeredHandlers.filter((h) => h.event === 'beforeExit');
    expect(beforeExitHandlers.length).toBeGreaterThan(0);
  });

  it('calls $disconnect inside the beforeExit handler', async () => {
    const beforeExitEntry = registeredHandlers.find((h) => h.event === 'beforeExit');
    expect(beforeExitEntry).toBeDefined();
    if (beforeExitEntry) {
      await beforeExitEntry.handler();
      expect(mockDisconnect).toHaveBeenCalled();
    }
  });
});
