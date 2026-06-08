import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import type { Bookmark } from '../../../api/types.js';

// vi.mock is hoisted — use vi.hoisted() so the mock variables are available when factories run
const { bookmarksApiMock } = vi.hoisted(() => ({
  bookmarksApiMock: {
    upsert: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../api/bookmarks.js', () => ({ bookmarksApi: bookmarksApiMock }));
vi.mock('../../../api/client.js', () => ({
  ApiClientError: class ApiClientError extends Error {
    constructor(public code: string, message: string, public details?: unknown, public errorClass?: string) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
  classifyError: vi.fn(() => 'An error occurred.'),
}));

import BookmarkButton from '../../../features/lessons/BookmarkButton.js';

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: 'bm-1',
    note: 'My note',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('BookmarkButton', () => {
  const assignmentId = 'assign-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trigger button', () => {
    it('renders an "Add bookmark" button when no bookmark exists', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      expect(screen.getByRole('button', { name: 'Add bookmark' })).toBeInTheDocument();
    });

    it('renders an "Edit bookmark" button when a bookmark exists', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark()}
          onBookmarkChange={vi.fn()}
        />,
      );
      expect(screen.getByRole('button', { name: 'Edit bookmark' })).toBeInTheDocument();
    });

    it('has aria-pressed=false when no bookmark', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      const btn = screen.getByRole('button', { name: 'Add bookmark' });
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    });

    it('has aria-pressed=true when bookmark exists', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark()}
          onBookmarkChange={vi.fn()}
        />,
      );
      const btn = screen.getByRole('button', { name: 'Edit bookmark' });
      expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('popover', () => {
    it('opens the popover dialog when the trigger button is clicked', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      expect(screen.getByRole('dialog', { name: 'Add bookmark' })).toBeInTheDocument();
    });

    it('shows "Add Bookmark" heading when no existing bookmark', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      expect(screen.getByText('Add Bookmark')).toBeInTheDocument();
    });

    it('shows "Edit Bookmark" heading when existing bookmark', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark()}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Edit bookmark' }));
      expect(screen.getByText('Edit Bookmark')).toBeInTheDocument();
    });

    it('pre-fills the textarea with existing bookmark note', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark({ note: 'Pre-filled note' })}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Edit bookmark' }));
      const textarea = screen.getByRole('textbox', { name: 'Bookmark note' });
      expect(textarea).toHaveValue('Pre-filled note');
    });

    it('textarea is empty when no existing bookmark', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      const textarea = screen.getByRole('textbox', { name: 'Bookmark note' });
      expect(textarea).toHaveValue('');
    });

    it('Save button is present in the popover', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('Save button is disabled when note is empty', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      const saveBtn = screen.getByRole('button', { name: /save/i });
      expect(saveBtn).toBeDisabled();
    });

    it('Save button is enabled when note has text', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Bookmark note' }), {
        target: { value: 'Some note text' },
      });
      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
    });

    it('shows Delete button when editing an existing bookmark', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark()}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Edit bookmark' }));
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('does not show Delete button when no bookmark', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('closes popover when Close button is clicked', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Close bookmark editor' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes popover when Escape key is pressed', () => {
      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('save action', () => {
    it('calls bookmarksApi.upsert with assignmentId and note text', async () => {
      const saved = makeBookmark({ note: 'New note' });
      bookmarksApiMock.upsert.mockResolvedValueOnce(saved);

      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Bookmark note' }), {
        target: { value: 'New note' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => expect(bookmarksApiMock.upsert).toHaveBeenCalledWith(assignmentId, 'New note'));
    });

    it('calls onBookmarkChange with the returned bookmark on successful save', async () => {
      const saved = makeBookmark({ note: 'New note' });
      bookmarksApiMock.upsert.mockResolvedValueOnce(saved);
      const onBookmarkChange = vi.fn();

      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={onBookmarkChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Bookmark note' }), {
        target: { value: 'New note' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => expect(onBookmarkChange).toHaveBeenCalledWith(saved));
    });

    it('closes the popover after a successful save', async () => {
      const saved = makeBookmark({ note: 'New note' });
      bookmarksApiMock.upsert.mockResolvedValueOnce(saved);

      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Bookmark note' }), {
        target: { value: 'New note' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('calls bookmarksApi.upsert only once per click (no double-submit)', async () => {
      const saved = makeBookmark({ note: 'Some note' });
      bookmarksApiMock.upsert.mockResolvedValue(saved);

      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={null}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }));
      fireEvent.change(screen.getByRole('textbox', { name: 'Bookmark note' }), {
        target: { value: 'Some note' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() => expect(bookmarksApiMock.upsert).toHaveBeenCalledTimes(1));
    });
  });

  describe('delete action', () => {
    it('calls bookmarksApi.delete with assignmentId', async () => {
      bookmarksApiMock.delete.mockResolvedValueOnce(undefined);

      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark()}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Edit bookmark' }));
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => expect(bookmarksApiMock.delete).toHaveBeenCalledWith(assignmentId));
    });

    it('calls onBookmarkChange with null after successful delete', async () => {
      bookmarksApiMock.delete.mockResolvedValueOnce(undefined);
      const onBookmarkChange = vi.fn();

      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark()}
          onBookmarkChange={onBookmarkChange}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Edit bookmark' }));
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => expect(onBookmarkChange).toHaveBeenCalledWith(null));
    });

    it('closes the popover after a successful delete', async () => {
      bookmarksApiMock.delete.mockResolvedValueOnce(undefined);

      render(
        <BookmarkButton
          assignmentId={assignmentId}
          bookmark={makeBookmark()}
          onBookmarkChange={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Edit bookmark' }));
      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });
});
