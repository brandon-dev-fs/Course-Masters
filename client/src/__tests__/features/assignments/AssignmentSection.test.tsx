import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssignmentSection from '../../../features/lessons/AssignmentSection.js';
import type { AssignmentItem } from '../../../features/lessons/AssignmentSection.js';

function makeItem(overrides: Partial<AssignmentItem> = {}): AssignmentItem {
  return {
    key: 'item-1',
    kind: 'assignment',
    id: 'a1',
    title: 'My Assignment',
    isRequired: false,
    order: 1,
    ...overrides,
  };
}

function renderSection(props: Partial<React.ComponentProps<typeof AssignmentSection>> = {}) {
  const defaults = {
    item: makeItem(),
    isComplete: false,
    isLocked: false,
    canEdit: false,
    isFirst: false,
    isLast: false,
    incompleteRequired: [] as AssignmentItem[],
    onToggleCompletion: vi.fn(),
    onPrev: vi.fn(),
    onNext: vi.fn(),
    children: <div>Child content</div>,
  };
  return render(
    <MemoryRouter>
      <AssignmentSection {...defaults} {...props} />
    </MemoryRouter>,
  );
}

describe('AssignmentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── getTypeLabel ────────────────────────────────────────────────────────

  describe('getTypeLabel', () => {
    it('returns "Plan" for lessonPlan kind', () => {
      renderSection({ item: makeItem({ kind: 'lessonPlan' }) });
      expect(screen.getByText('Plan')).toBeTruthy();
    });

    it('returns "Quiz" for quiz kind', () => {
      renderSection({ item: makeItem({ kind: 'quiz' }) });
      expect(screen.getByText('Quiz')).toBeTruthy();
    });

    it('returns "Read" for note assignmentType', () => {
      renderSection({ item: makeItem({ assignmentType: 'note' }) });
      expect(screen.getByText('Read')).toBeTruthy();
    });

    it('returns "Video" for video assignmentType', () => {
      renderSection({ item: makeItem({ assignmentType: 'video' }) });
      expect(screen.getByText('Video')).toBeTruthy();
    });

    it('returns "Link" for reading assignmentType', () => {
      renderSection({ item: makeItem({ assignmentType: 'reading' }) });
      expect(screen.getByText('Link')).toBeTruthy();
    });

    it('returns "Vocab" for vocab assignmentType', () => {
      renderSection({ item: makeItem({ assignmentType: 'vocab' }) });
      expect(screen.getByText('Vocab')).toBeTruthy();
    });

    it('returns "Practice" for practice_problem assignmentType', () => {
      renderSection({ item: makeItem({ assignmentType: 'practice_problem' }) });
      expect(screen.getByText('Practice')).toBeTruthy();
    });

    it('returns "File" for file assignmentType', () => {
      renderSection({ item: makeItem({ assignmentType: 'file' }) });
      expect(screen.getByText('File')).toBeTruthy();
    });

    it('returns "Read" as default fallback', () => {
      renderSection({ item: makeItem({ kind: 'assignment' }) });
      // No assignmentType set — falls through to default 'Read'
      expect(screen.getByText('Read')).toBeTruthy();
    });
  });

  // ─── displayTitle ────────────────────────────────────────────────────────

  describe('displayTitle', () => {
    it('shows item.title when kind is not file', () => {
      renderSection({ item: makeItem({ title: 'My Note', assignmentType: 'note' }) });
      expect(screen.getByRole('heading', { name: 'My Note' })).toBeTruthy();
    });

    it('shows item.title for file assignments regardless of mimeType', () => {
      renderSection({ item: makeItem({ title: 'Course Syllabus', assignmentType: 'file', mimeType: 'application/pdf' }) });
      expect(screen.getByRole('heading', { name: 'Course Syllabus' })).toBeTruthy();
    });

    it('shows item.title for file assignments with no mimeType', () => {
      renderSection({ item: makeItem({ title: 'My File', assignmentType: 'file' }) });
      expect(screen.getByRole('heading', { name: 'My File' })).toBeTruthy();
    });
  });

  // ─── Locked state ────────────────────────────────────────────────────────

  describe('isLocked', () => {
    it('shows lock UI when isLocked=true', () => {
      renderSection({ isLocked: true });
      expect(screen.getByText(/complete required assignments to unlock the quiz/i)).toBeTruthy();
    });

    it('hides children content when isLocked=true', () => {
      renderSection({ isLocked: true, children: <div>Hidden child</div> });
      expect(screen.queryByText('Hidden child')).toBeNull();
    });

    it('shows list of incomplete required items when locked', () => {
      const incompleteRequired: AssignmentItem[] = [
        makeItem({ key: 'r1', title: 'Read Chapter 1', kind: 'assignment' }),
        makeItem({ key: 'r2', title: 'Watch Video', kind: 'assignment' }),
      ];
      renderSection({ isLocked: true, incompleteRequired });
      expect(screen.getByText('Read Chapter 1')).toBeTruthy();
      expect(screen.getByText('Watch Video')).toBeTruthy();
    });

    it('hides the footer when isLocked=true', () => {
      renderSection({ isLocked: true });
      expect(screen.queryByText(/mark complete/i)).toBeNull();
    });
  });

  // ─── Completion button ───────────────────────────────────────────────────

  describe('completion button', () => {
    it('shows "Mark complete" button when kind=assignment and not locked', () => {
      renderSection({ item: makeItem({ kind: 'assignment' }), isLocked: false });
      expect(screen.getByText(/mark complete/i)).toBeTruthy();
    });

    it('shows "Completed" button text when isComplete=true', () => {
      renderSection({ item: makeItem({ kind: 'assignment' }), isComplete: true });
      expect(screen.getByText('Completed')).toBeTruthy();
    });

    it('does not show completion button when kind=quiz', () => {
      renderSection({ item: makeItem({ kind: 'quiz' }), isLocked: false });
      expect(screen.queryByText(/mark complete/i)).toBeNull();
    });

    it('does not show completion button when kind=lessonPlan', () => {
      renderSection({ item: makeItem({ kind: 'lessonPlan' }), isLocked: false });
      expect(screen.queryByText(/mark complete/i)).toBeNull();
    });

    it('calls onToggleCompletion when button is clicked', () => {
      const onToggleCompletion = vi.fn();
      renderSection({ item: makeItem({ kind: 'assignment' }), onToggleCompletion });
      fireEvent.click(screen.getByText(/mark complete/i));
      expect(onToggleCompletion).toHaveBeenCalledOnce();
    });
  });

  // ─── Navigation ──────────────────────────────────────────────────────────

  describe('prev/next navigation', () => {
    it('shows "Next" button when not last', () => {
      renderSection({ isLast: false });
      expect(screen.getByRole('button', { name: /next/i })).toBeTruthy();
    });

    it('hides "Next" button when isLast=true', () => {
      renderSection({ isLast: true });
      expect(screen.queryByRole('button', { name: /next/i })).toBeNull();
    });

    it('shows "Back" button when not first', () => {
      renderSection({ isFirst: false });
      expect(screen.getByRole('button', { name: /back/i })).toBeTruthy();
    });

    it('hides "Back" button when isFirst=true', () => {
      renderSection({ isFirst: true });
      expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
    });

    it('calls onNext when Next is clicked', () => {
      const onNext = vi.fn();
      renderSection({ isLast: false, onNext });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      expect(onNext).toHaveBeenCalledOnce();
    });

    it('calls onPrev when Back is clicked', () => {
      const onPrev = vi.fn();
      renderSection({ isFirst: false, onPrev });
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      expect(onPrev).toHaveBeenCalledOnce();
    });
  });

  // ─── Edit controls (canEdit) ─────────────────────────────────────────────

  describe('edit controls', () => {
    it('shows edit button when canEdit=true and onEdit provided', () => {
      renderSection({ canEdit: true, item: makeItem({ title: 'My Item' }), onEdit: vi.fn() });
      expect(screen.getByRole('button', { name: /edit my item/i })).toBeTruthy();
    });

    it('calls onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();
      renderSection({ canEdit: true, item: makeItem({ title: 'My Item' }), onEdit });
      fireEvent.click(screen.getByRole('button', { name: /edit my item/i }));
      expect(onEdit).toHaveBeenCalledOnce();
    });

    it('shows delete button when canEdit=true and onDelete provided', () => {
      renderSection({ canEdit: true, item: makeItem({ title: 'My Item' }), onDelete: vi.fn() });
      expect(screen.getByRole('button', { name: /delete my item/i })).toBeTruthy();
    });

    it('calls onDelete when delete button is clicked', () => {
      const onDelete = vi.fn();
      renderSection({ canEdit: true, item: makeItem({ title: 'My Item' }), onDelete });
      fireEvent.click(screen.getByRole('button', { name: /delete my item/i }));
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it('hides edit/delete buttons when canEdit=false', () => {
      renderSection({ canEdit: false, item: makeItem({ title: 'My Item' }), onEdit: vi.fn(), onDelete: vi.fn() });
      expect(screen.queryByRole('button', { name: /edit my item/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /delete my item/i })).toBeNull();
    });
  });

  // ─── Content rendering ───────────────────────────────────────────────────

  describe('children content', () => {
    it('renders children when not locked', () => {
      renderSection({ isLocked: false, children: <div>My content</div> });
      expect(screen.getByText('My content')).toBeTruthy();
    });

    it('renders headerRight node when provided', () => {
      renderSection({ headerRight: <span>Header Extra</span> });
      expect(screen.getByText('Header Extra')).toBeTruthy();
    });
  });
});
