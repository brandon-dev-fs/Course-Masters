import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    environmentMatchGlobs: [
      // API and utility tests have no DOM dependencies — skip jsdom overhead
      ['src/__tests__/api/**', 'node'],
      ['src/__tests__/utils/**', 'node'],
    ],
    clearMocks: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 15000,
    hookTimeout: 10000,
    pool: 'threads',
    maxWorkers: 8,
    minWorkers: 4,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/components/RichTextEditor.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/**',
      ],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
        perFile: false,
      },
    },
  },
});
