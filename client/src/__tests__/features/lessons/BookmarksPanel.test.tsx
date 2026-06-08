import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import type { Assignment, Bookmark } from '../../../api/types.js';
import BookmarksPanel from '../../../features/lessons/BookmarksPanel.js';

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: 'bm-1',
    note: 'A bookmark note',
    updatedAt: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

function makeAssignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: 'assign-1',
    lessonId: 'lesson-1',
    order: 1,
    title: 'Assignment One',
    objective: null,
    type: 'note',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    completed: false,
    bookmark: null,
    noteAssignment: null,
    videoAssignment: null,
    readingAssignment: null,
    vocabAssignment: null,
    practiceProblemAssignment: null,
    ...overrides,
  };
}

describe('BookmarksPanel', () => {
  describe('empty state', () => {
    it('renders empty state message when no assignments have bookmarks', () => {
      const assignments = [
        makeAssignment({ id: 'a-1', bookmark: null }),
        makeAssignment({ id: 'a-2', bookmark: null }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={vi.fn()} />);
      expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
    });

    it('renders empty state message when assignments array is empty', () => {
      render(<BookmarksPanel assignments={[]} onNavigate={vi.fn()} />);
      expect(screen.getByText('No bookmarks yet')).toBeInTheDocument();
    });

    it('shows descriptive help text in empty state', () => {
      render(<BookmarksPanel assignments={[]} onNavigate={vi.fn()} />);
      expect(screen.getByText(/click the bookmark icon/i)).toBeInTheDocument();
    });
  });

  describe('bookmark list', () => {
    it('renders a list item for each bookmarked assignment', () => {
      const assignments = [
        makeAssignment({ id: 'a-1', title: 'Lesson Plan', order: 1, bookmark: makeBookmark({ id: 'bm-1' }) }),
        makeAssignment({ id: 'a-2', title: 'Video Watch', order: 2, bookmark: makeBookmark({ id: 'bm-2' }) }),
        makeAssignment({ id: 'a-3', title: 'No Bookmark', order: 3, bookmark: null }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={vi.fn()} />);
      expect(screen.getByText('Lesson Plan')).toBeInTheDocument();
      expect(screen.getByText('Video Watch')).toBeInTheDocument();
      expect(screen.queryByText('No Bookmark')).not.toBeInTheDocument();
    });

    it('does not render assignments without a bookmark', () => {
      const assignments = [
        makeAssignment({ id: 'a-1', title: 'Has Bookmark', bookmark: makeBookmark() }),
        makeAssignment({ id: 'a-2', title: 'No Bookmark', bookmark: null }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={vi.fn()} />);
      expect(screen.getByText('Has Bookmark')).toBeInTheDocument();
      expect(screen.queryByText('No Bookmark')).not.toBeInTheDocument();
    });

    it('renders the bookmark note text when present', () => {
      const assignments = [
        makeAssignment({
          id: 'a-1',
          bookmark: makeBookmark({ note: 'My important note' }),
        }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={vi.fn()} />);
      expect(screen.getByText('My important note')).toBeInTheDocument();
    });

    it('renders items sorted by assignment order', () => {
      const assignments = [
        makeAssignment({ id: 'a-3', title: 'Third', order: 3, bookmark: makeBookmark({ id: 'bm-3' }) }),
        makeAssignment({ id: 'a-1', title: 'First', order: 1, bookmark: makeBookmark({ id: 'bm-1' }) }),
        makeAssignment({ id: 'a-2', title: 'Second', order: 2, bookmark: makeBookmark({ id: 'bm-2' }) }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={vi.fn()} />);

      const buttons = screen.getAllByRole('button');
      const titles = buttons.map(b => b.textContent ?? '');
      const firstIdx = titles.findIndex(t => t.includes('First'));
      const secondIdx = titles.findIndex(t => t.includes('Second'));
      const thirdIdx = titles.findIndex(t => t.includes('Third'));
      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
    });

    it('renders as a list element (role=list)', () => {
      const assignments = [
        makeAssignment({ id: 'a-1', bookmark: makeBookmark() }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={vi.fn()} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('calls onNavigate with the assignment id when a bookmark item is clicked', () => {
      const onNavigate = vi.fn();
      const assignments = [
        makeAssignment({ id: 'a-1', title: 'My Assignment', bookmark: makeBookmark() }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={onNavigate} />);
      fireEvent.click(screen.getByText('My Assignment'));
      expect(onNavigate).toHaveBeenCalledWith('a-1');
    });

    it('calls onNavigate for the correct assignment when multiple bookmarks are present', () => {
      const onNavigate = vi.fn();
      const assignments = [
        makeAssignment({ id: 'a-1', title: 'First Assignment', order: 1, bookmark: makeBookmark({ id: 'bm-1' }) }),
        makeAssignment({ id: 'a-2', title: 'Second Assignment', order: 2, bookmark: makeBookmark({ id: 'bm-2' }) }),
      ];
      render(<BookmarksPanel assignments={assignments} onNavigate={onNavigate} />);
      fireEvent.click(screen.getByText('Second Assignment'));
      expect(onNavigate).toHaveBeenCalledWith('a-2');
      expect(onNavigate).not.toHaveBeenCalledWith('a-1');
    });
  });
});
