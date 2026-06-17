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

    it('shows file type label for PDF when assignmentType is file and mimeType is set', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/pdf' }) });
      expect(screen.getByRole('heading', { name: 'PDF Document' })).toBeTruthy();
    });

    it('shows "Text File" label for text/plain mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'text/plain' }) });
      expect(screen.getByRole('heading', { name: 'Text File' })).toBeTruthy();
    });

    it('shows "Word Document" label for docx mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) });
      expect(screen.getByRole('heading', { name: 'Word Document' })).toBeTruthy();
    });

    it('shows "Word Document" label for doc mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/msword' }) });
      expect(screen.getByRole('heading', { name: 'Word Document' })).toBeTruthy();
    });

    it('shows "PowerPoint" label for pptx mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }) });
      expect(screen.getByRole('heading', { name: 'PowerPoint' })).toBeTruthy();
    });

    it('shows "PowerPoint" label for ppt mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/vnd.ms-powerpoint' }) });
      expect(screen.getByRole('heading', { name: 'PowerPoint' })).toBeTruthy();
    });

    it('shows "Excel Spreadsheet" label for xlsx mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) });
      expect(screen.getByRole('heading', { name: 'Excel Spreadsheet' })).toBeTruthy();
    });

    it('shows "Excel Spreadsheet" label for xls mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/vnd.ms-excel' }) });
      expect(screen.getByRole('heading', { name: 'Excel Spreadsheet' })).toBeTruthy();
    });

    it('shows "PNG Image" label for image/png mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'image/png' }) });
      expect(screen.getByRole('heading', { name: 'PNG Image' })).toBeTruthy();
    });

    it('shows "JPEG Image" label for image/jpeg mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'image/jpeg' }) });
      expect(screen.getByRole('heading', { name: 'JPEG Image' })).toBeTruthy();
    });

    it('shows "GIF Image" label for image/gif mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'image/gif' }) });
      expect(screen.getByRole('heading', { name: 'GIF Image' })).toBeTruthy();
    });

    it('shows "WebP Image" label for image/webp mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'image/webp' }) });
      expect(screen.getByRole('heading', { name: 'WebP Image' })).toBeTruthy();
    });

    it('shows "SVG Image" label for image/svg+xml mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'image/svg+xml' }) });
      expect(screen.getByRole('heading', { name: 'SVG Image' })).toBeTruthy();
    });

    it('shows "Video File" label for video/* mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'video/mp4' }) });
      expect(screen.getByRole('heading', { name: 'Video File' })).toBeTruthy();
    });

    it('shows "Audio File" label for audio/* mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'audio/mpeg' }) });
      expect(screen.getByRole('heading', { name: 'Audio File' })).toBeTruthy();
    });

    it('shows "Image" label for generic image/* mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'image/tiff' }) });
      expect(screen.getByRole('heading', { name: 'Image' })).toBeTruthy();
    });

    it('shows "File" label for unknown mimeType', () => {
      renderSection({ item: makeItem({ title: 'Upload', assignmentType: 'file', mimeType: 'application/octet-stream' }) });
      expect(screen.getByRole('heading', { name: 'File' })).toBeTruthy();
    });

    it('uses item.title when assignmentType is file but no mimeType', () => {
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
