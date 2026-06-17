const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));

vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../api/assignments.js', () => ({
  getFileDownloadUrl: (id: string) => `/api/assignments/${id}/file`,
  assignmentsApi: {
    get: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    complete: vi.fn(),
    uncomplete: vi.fn(),
    getSavedFlashCards: vi.fn(),
    saveFlashCard: vi.fn(),
    removeFlashCard: vi.fn(),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FileAssignmentView from '../../../features/assignments/FileAssignmentView.js';
import type { FileAssignmentData } from '../../../api/types.js';

function makeFileData(overrides: Partial<FileAssignmentData> = {}): FileAssignmentData {
  return {
    id: 'fad1',
    assignmentId: 'asgn-1',
    filename: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    ...overrides,
  };
}

function renderView(assignmentId: string, fileAssignment: FileAssignmentData) {
  return render(
    <MemoryRouter>
      <FileAssignmentView assignmentId={assignmentId} fileAssignment={fileAssignment} />
    </MemoryRouter>,
  );
}

describe('FileAssignmentView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── formatFileSize ───────────────────────────────────────────────────────

  describe('formatFileSize (via rendered footer)', () => {
    it('shows bytes when sizeBytes < 1024', () => {
      renderView('asgn-1', makeFileData({ sizeBytes: 500, mimeType: 'application/vnd.ms-powerpoint', filename: 'slide.ppt' }));
      expect(screen.getByText('500 B')).toBeTruthy();
    });

    it('shows KB when sizeBytes is between 1024 and 1MB', () => {
      renderView('asgn-1', makeFileData({ sizeBytes: 2048, mimeType: 'application/vnd.ms-powerpoint', filename: 'slide.ppt' }));
      expect(screen.getByText('2.0 KB')).toBeTruthy();
    });

    it('shows MB when sizeBytes >= 1MB', () => {
      renderView('asgn-1', makeFileData({ sizeBytes: 2 * 1024 * 1024, mimeType: 'application/vnd.ms-powerpoint', filename: 'slide.ppt' }));
      expect(screen.getByText('2.0 MB')).toBeTruthy();
    });
  });

  // ─── PdfViewer ────────────────────────────────────────────────────────────

  describe('PdfViewer (mimeType: application/pdf)', () => {
    it('renders a LoadingSpinner initially', () => {
      renderView('asgn-1', makeFileData({ mimeType: 'application/pdf', filename: 'doc.pdf' }));
      // LoadingSpinner is present while loading
      const region = screen.getByRole('region', { name: 'PDF preview' });
      expect(region).toBeTruthy();
    });

    it('renders an iframe with the download URL as src', () => {
      renderView('asgn-1', makeFileData({ mimeType: 'application/pdf', filename: 'doc.pdf' }));
      const iframe = document.querySelector('iframe');
      expect(iframe).toBeTruthy();
      expect(iframe?.getAttribute('src')).toBe('/api/assignments/asgn-1/file');
    });

    it('hides spinner and shows iframe after onLoad fires', () => {
      renderView('asgn-1', makeFileData({ mimeType: 'application/pdf', filename: 'doc.pdf' }));
      const iframe = document.querySelector('iframe')!;
      // Before load: iframe is hidden
      expect(iframe.className).toContain('hidden');
      // Simulate load
      fireEvent.load(iframe);
      // After load: iframe is visible
      expect(iframe.className).toContain('block');
    });

    it('shows fallback card after 10s timeout using fake timers', async () => {
      vi.useFakeTimers();
      renderView('asgn-1', makeFileData({ mimeType: 'application/pdf', filename: 'doc.pdf' }));
      // Initially no fallback message
      expect(screen.queryByText(/PDF preview is not available/i)).toBeNull();
      // Advance 10 seconds
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });
      expect(screen.getByText(/PDF preview is not available/i)).toBeTruthy();
    });

    it('fallback card has download link after 10s timeout', async () => {
      vi.useFakeTimers();
      renderView('asgn-1', makeFileData({ mimeType: 'application/pdf', filename: 'doc.pdf' }));
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });
      const downloadLink = screen.getByRole('link', { name: /download pdf/i });
      expect(downloadLink.getAttribute('href')).toBe('/api/assignments/asgn-1/file');
      expect(downloadLink.getAttribute('download')).toBe('doc.pdf');
    });
  });

  // ─── TxtViewer ────────────────────────────────────────────────────────────

  describe('TxtViewer (mimeType: text/plain)', () => {
    beforeEach(() => {
      // Mock global fetch for TxtViewer
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Hello, world!'),
      } as unknown as Response);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('renders a loading spinner while fetching', () => {
      globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
      renderView('asgn-1', makeFileData({ mimeType: 'text/plain', filename: 'readme.txt', sizeBytes: 13 }));
      // Should show loading state (spinner)
      expect(document.querySelector('[class*="animate"]') ?? document.querySelector('svg')).toBeTruthy();
    });

    it('renders fetched text content', async () => {
      await act(async () => {
        renderView('asgn-1', makeFileData({ mimeType: 'text/plain', filename: 'readme.txt', sizeBytes: 13 }));
      });
      expect(screen.getByText('Hello, world!')).toBeTruthy();
    });

    it('shows the region with the filename label', async () => {
      await act(async () => {
        renderView('asgn-1', makeFileData({ mimeType: 'text/plain', filename: 'readme.txt', sizeBytes: 13 }));
      });
      expect(screen.getByRole('region', { name: /text file: readme\.txt/i })).toBeTruthy();
    });

    it('shows error message when fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      await act(async () => {
        renderView('asgn-1', makeFileData({ mimeType: 'text/plain', filename: 'readme.txt', sizeBytes: 13 }));
      });
      expect(screen.getByText(/could not load file content/i)).toBeTruthy();
    });

    it('shows error message when fetch returns non-ok status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(''),
      } as unknown as Response);
      await act(async () => {
        renderView('asgn-1', makeFileData({ mimeType: 'text/plain', filename: 'readme.txt', sizeBytes: 13 }));
      });
      expect(screen.getByText(/could not load file content/i)).toBeTruthy();
    });

    it('dispatches auth:unauthorized event on 401', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve(''),
      } as unknown as Response);
      await act(async () => {
        renderView('asgn-1', makeFileData({ mimeType: 'text/plain', filename: 'readme.txt', sizeBytes: 13 }));
      });
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:unauthorized' }));
    });
  });

  // ─── DownloadCard ─────────────────────────────────────────────────────────

  describe('DownloadCard (other mime types)', () => {
    it('renders for application/vnd.ms-powerpoint', () => {
      renderView('asgn-1', makeFileData({ mimeType: 'application/vnd.ms-powerpoint', filename: 'slides.ppt' }));
      expect(screen.getByText(/cannot be previewed/i)).toBeTruthy();
    });

    it('download link has correct href and download attribute', () => {
      renderView('asgn-1', makeFileData({ mimeType: 'application/vnd.ms-powerpoint', filename: 'slides.ppt' }));
      // There are two download links (DownloadCard + footer); the DownloadCard one is first
      const links = screen.getAllByRole('link', { name: /download slides\.ppt/i });
      expect(links[0].getAttribute('href')).toBe('/api/assignments/asgn-1/file');
      expect(links[0].getAttribute('download')).toBe('slides.ppt');
    });
  });

  // ─── Main component (file info footer) ────────────────────────────────────

  describe('file info footer', () => {
    it('renders filename in the footer', () => {
      renderView('asgn-1', makeFileData({ mimeType: 'application/vnd.ms-powerpoint', filename: 'slides.ppt', sizeBytes: 512 }));
      // The filename appears in multiple spans; confirm at least one is present
      expect(screen.getAllByText('slides.ppt').length).toBeGreaterThan(0);
    });

    it('footer download link has correct href and download attribute', () => {
      renderView('asgn-1', makeFileData({ mimeType: 'application/vnd.ms-powerpoint', filename: 'slides.ppt', sizeBytes: 512 }));
      // There may be multiple download links; the footer one says "Download" (visible text)
      const links = screen.getAllByRole('link');
      const footerLink = links.find(l => l.textContent?.includes('Download') && l.getAttribute('download') === 'slides.ppt');
      expect(footerLink).toBeTruthy();
      expect(footerLink?.getAttribute('href')).toBe('/api/assignments/asgn-1/file');
    });
  });
});
