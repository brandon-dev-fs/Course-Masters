import { describe, it, expect, vi } from 'vitest';

type FileFilterCb = (err: Error | null, accept?: boolean) => void;
type FileFilterFn = (_req: unknown, file: { mimetype: string; fieldname: string }, cb: FileFilterCb) => void;

// vi.hoisted makes capturedFileFilter and MockMulterError available inside the
// vi.mock factory, which is hoisted to the top of the file.
const { capturedFileFilterRef, MockMulterError } = vi.hoisted(() => {
  class MockMulterError extends Error {
    code: string;
    field?: string;
    constructor(code: string, field?: string) {
      super(code);
      this.code = code;
      this.field = field;
    }
  }

  const capturedFileFilterRef: { current: FileFilterFn } = {
    current: () => {},
  };

  return { capturedFileFilterRef, MockMulterError };
});

vi.mock('multer', () => {
  const mockSingle = vi.fn();
  const mockInstance = { single: () => mockSingle };
  const mockMulter = vi.fn((opts: { fileFilter: FileFilterFn }) => {
    capturedFileFilterRef.current = opts.fileFilter;
    return mockInstance;
  }) as unknown as {
    (opts: { fileFilter: FileFilterFn }): typeof mockInstance;
    memoryStorage: () => Record<string, unknown>;
    MulterError: typeof MockMulterError;
  };
  mockMulter.memoryStorage = vi.fn().mockReturnValue({});
  mockMulter.MulterError = MockMulterError;
  return { default: mockMulter };
});

import { ALLOWED_MIME_TYPES, uploadSingle } from '../../middleware/upload.js';

describe('upload middleware', () => {
  describe('ALLOWED_MIME_TYPES', () => {
    it('includes application/pdf', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    });

    it('includes .docx mime type', () => {
      expect(ALLOWED_MIME_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });

    it('includes text/plain', () => {
      expect(ALLOWED_MIME_TYPES).toContain('text/plain');
    });

    it('includes .ppt mime type', () => {
      expect(ALLOWED_MIME_TYPES).toContain('application/vnd.ms-powerpoint');
    });

    it('includes .pptx mime type', () => {
      expect(ALLOWED_MIME_TYPES).toContain(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      );
    });

    it('has exactly 5 allowed types', () => {
      expect(ALLOWED_MIME_TYPES).toHaveLength(5);
    });
  });

  describe('uploadSingle', () => {
    it('exports uploadSingle as a function', () => {
      expect(typeof uploadSingle).toBe('function');
    });
  });

  describe('fileFilter', () => {
    it('accepts PDF files', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(null, { mimetype: 'application/pdf', fieldname: 'file' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts .docx files', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(
        null,
        {
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          fieldname: 'file',
        },
        cb,
      );
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts plain text files', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(null, { mimetype: 'text/plain', fieldname: 'file' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts .ppt files', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(
        null,
        { mimetype: 'application/vnd.ms-powerpoint', fieldname: 'file' },
        cb,
      );
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('accepts .pptx files', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(
        null,
        {
          mimetype: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          fieldname: 'file',
        },
        cb,
      );
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('rejects image/jpeg with MulterError', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(null, { mimetype: 'image/jpeg', fieldname: 'file' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(MockMulterError));
    });

    it('rejects application/json with MulterError', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(null, { mimetype: 'application/json', fieldname: 'file' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(MockMulterError));
    });

    it('MulterError for rejected files has LIMIT_UNEXPECTED_FILE code', () => {
      const cb = vi.fn();
      capturedFileFilterRef.current(null, { mimetype: 'video/mp4', fieldname: 'myfield' }, cb);
      const err = cb.mock.calls[0][0] as InstanceType<typeof MockMulterError>;
      expect(err.code).toBe('LIMIT_UNEXPECTED_FILE');
    });
  });
});
