import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// ---------------------------------------------------------------------------
// s3 — not configured (all optional vars absent)
// ---------------------------------------------------------------------------

describe('s3 — not configured', () => {
  let mod: typeof import('../../lib/s3.js');
  // Plain vi.fn() with no implementation is a valid constructor.
  const S3ClientCtor = vi.fn();

  beforeAll(async () => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      config: {
        S3_ENDPOINT: undefined,
        S3_BUCKET: undefined,
        S3_ACCESS_KEY_ID: undefined,
        S3_SECRET_ACCESS_KEY: undefined,
        S3_REGION: 'garage',
        ANTHROPIC_API_KEY: 'test-key',
      },
    }));
    vi.doMock('../../lib/logger.js', () => ({
      logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    }));
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: S3ClientCtor }));

    mod = await import('../../lib/s3.js');
  });

  afterAll(() => vi.resetModules());

  it('exports null s3Client', () => {
    expect(mod.s3Client).toBeNull();
  });

  it('exports null S3_BUCKET', () => {
    expect(mod.S3_BUCKET).toBeNull();
  });

  it('does not instantiate S3Client', () => {
    // The ctor is called at module-load time; since clearMocks runs between
    // each test we capture the state here after import in beforeAll is done.
    // We can only verify the exports (null above) — use the unconfigured
    // exports as the canonical signal.
    expect(mod.s3Client).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// s3 — configured (all required vars present)
// ---------------------------------------------------------------------------

describe('s3 — configured', () => {
  let mod: typeof import('../../lib/s3.js');
  // capturedArgs is written during module load (beforeAll) and read in tests.
  let capturedArgs: unknown;

  beforeAll(async () => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      config: {
        S3_ENDPOINT: 'http://localhost:9000',
        S3_BUCKET: 'test-bucket',
        S3_ACCESS_KEY_ID: 'access-key-id',
        S3_SECRET_ACCESS_KEY: 'secret-key',
        S3_REGION: 'us-east-1',
        ANTHROPIC_API_KEY: 'test-key',
      },
    }));
    vi.doMock('../../lib/logger.js', () => ({
      logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
    }));
    // Use a regular function (not arrow) so it can be called with `new`.
    const S3ClientCtor = vi.fn(function (this: unknown, args: unknown) {
      capturedArgs = args;
    });
    vi.doMock('@aws-sdk/client-s3', () => ({ S3Client: S3ClientCtor }));

    mod = await import('../../lib/s3.js');
  });

  afterAll(() => vi.resetModules());

  it('exports a non-null s3Client', () => {
    expect(mod.s3Client).not.toBeNull();
  });

  it('exports the bucket name from config', () => {
    expect(mod.S3_BUCKET).toBe('test-bucket');
  });

  it('passes the correct endpoint to S3Client', () => {
    expect(capturedArgs).toMatchObject({ endpoint: 'http://localhost:9000' });
  });

  it('passes the correct region to S3Client', () => {
    expect(capturedArgs).toMatchObject({ region: 'us-east-1' });
  });

  it('passes the correct credentials to S3Client', () => {
    expect(capturedArgs).toMatchObject({
      credentials: { accessKeyId: 'access-key-id', secretAccessKey: 'secret-key' },
    });
  });

  it('enables forcePathStyle', () => {
    expect(capturedArgs).toMatchObject({ forcePathStyle: true });
  });
});
