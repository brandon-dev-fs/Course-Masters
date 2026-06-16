import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LearningResourceNav from '../../../features/lessons/LearningResourceNav.js';
import type { LearningResource } from '../../../features/lessons/LearningResourceNav.js';

function makeResource(overrides: Partial<LearningResource> = {}): LearningResource {
  return {
    key: 'r1',
    type: 'note',
    title: 'My Note',
    id: 'note-1',
    ...overrides,
  };
}

const defaultProps = {
  resources: [makeResource()],
  activeResourceKey: 'r1',
  onResourceChange: vi.fn(),
  completedKeys: new Set<string>(),
  quizUnlocked: false,
};

function renderNav(props: Partial<React.ComponentProps<typeof LearningResourceNav>> = {}) {
  return render(<LearningResourceNav {...defaultProps} {...props} />);
}

describe('LearningResourceNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resource rendering', () => {
    it('renders a nav with aria-label', () => {
      renderNav();
      expect(screen.getByRole('navigation', { name: /learning resources/i })).toBeTruthy();
    });

    it('renders all resource titles', () => {
      renderNav({
        resources: [
          makeResource({ key: 'r1', title: 'Video 1', type: 'video' }),
          makeResource({ key: 'r2', title: 'Note 2', type: 'note' }),
        ],
        activeResourceKey: 'r1',
      });
      expect(screen.getByText('Video 1')).toBeTruthy();
      expect(screen.getByText('Note 2')).toBeTruthy();
    });

    it('applies active styling to the active resource', () => {
      renderNav({ activeResourceKey: 'r1' });
      const btn = screen.getByRole('button', { name: /My Note/i });
      expect(btn.className).toContain('bg-primary-subtle');
    });

    it('does not apply active styling to inactive resources', () => {
      renderNav({
        resources: [
          makeResource({ key: 'r1', title: 'Note 1' }),
          makeResource({ key: 'r2', title: 'Note 2' }),
        ],
        activeResourceKey: 'r1',
      });
      const btn2 = screen.getByRole('button', { name: /Note 2/i });
      expect(btn2.className).not.toContain('bg-primary-subtle');
    });

    it('calls onResourceChange when a resource button is clicked', () => {
      const onResourceChange = vi.fn();
      renderNav({ onResourceChange });
      fireEvent.click(screen.getByRole('button', { name: /My Note/i }));
      expect(onResourceChange).toHaveBeenCalledWith('r1');
    });

    it('renders lessonPlan type resource', () => {
      renderNav({ resources: [makeResource({ type: 'lessonPlan', title: 'Lesson Plan' })] });
      expect(screen.getByText('Lesson Plan')).toBeTruthy();
    });

    it('renders vocab type resource', () => {
      renderNav({ resources: [makeResource({ type: 'vocab', title: 'Vocabulary' })] });
      expect(screen.getByText('Vocabulary')).toBeTruthy();
    });

    it('renders lecture type resource', () => {
      renderNav({ resources: [makeResource({ type: 'lecture', title: 'Lecture 1' })] });
      expect(screen.getByText('Lecture 1')).toBeTruthy();
    });

    it('renders video type resource', () => {
      renderNav({ resources: [makeResource({ type: 'video', title: 'Video 1' })] });
      expect(screen.getByText('Video 1')).toBeTruthy();
    });
  });

  describe('quiz button', () => {
    it('renders a Quiz button', () => {
      renderNav();
      expect(screen.getByRole('button', { name: /quiz/i })).toBeTruthy();
    });

    it('quiz button is disabled when quizUnlocked=false', () => {
      renderNav({ quizUnlocked: false });
      expect(screen.getByRole('button', { name: /quiz/i })).toBeDisabled();
    });

    it('quiz button is not disabled when quizUnlocked=true', () => {
      renderNav({ quizUnlocked: true });
      expect(screen.getByRole('button', { name: /quiz/i })).not.toBeDisabled();
    });

    it('calls onResourceChange with "quiz" when quiz button is clicked and unlocked', () => {
      const onResourceChange = vi.fn();
      renderNav({ quizUnlocked: true, onResourceChange });
      fireEvent.click(screen.getByRole('button', { name: /quiz/i }));
      expect(onResourceChange).toHaveBeenCalledWith('quiz');
    });

    it('does not call onResourceChange when quiz is clicked while locked', () => {
      const onResourceChange = vi.fn();
      renderNav({ quizUnlocked: false, onResourceChange });
      fireEvent.click(screen.getByRole('button', { name: /quiz/i }));
      expect(onResourceChange).not.toHaveBeenCalledWith('quiz');
    });

    it('applies active styling when quiz is active', () => {
      renderNav({ activeResourceKey: 'quiz', quizUnlocked: true });
      const quizBtn = screen.getByRole('button', { name: /quiz/i });
      expect(quizBtn.className).toContain('bg-primary-subtle');
    });
  });

  describe('canEdit mode — move and delete controls', () => {
    const twoNotes = [
      makeResource({ key: 'r1', title: 'Note 1', type: 'note' }),
      makeResource({ key: 'r2', title: 'Note 2', type: 'note' }),
    ];

    it('shows move left buttons for reorderable resources', () => {
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource: vi.fn(), onDeleteResource: vi.fn() });
      expect(screen.getAllByTitle('Move left').length).toBeGreaterThan(0);
    });

    it('disables move left for the first reorderable resource', () => {
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource: vi.fn(), onDeleteResource: vi.fn() });
      const moveLeftBtns = screen.getAllByTitle('Move left');
      expect(moveLeftBtns[0]).toBeDisabled();
    });

    it('enables move left for a non-first resource', () => {
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource: vi.fn(), onDeleteResource: vi.fn() });
      const moveLeftBtns = screen.getAllByTitle('Move left');
      expect(moveLeftBtns[1]).not.toBeDisabled();
    });

    it('disables move right for the last reorderable resource', () => {
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource: vi.fn(), onDeleteResource: vi.fn() });
      const moveRightBtns = screen.getAllByTitle('Move right');
      expect(moveRightBtns[moveRightBtns.length - 1]).toBeDisabled();
    });

    it('enables move right for a non-last resource', () => {
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource: vi.fn(), onDeleteResource: vi.fn() });
      const moveRightBtns = screen.getAllByTitle('Move right');
      expect(moveRightBtns[0]).not.toBeDisabled();
    });

    it('calls onMoveResource with "right" when move right is clicked', () => {
      const onMoveResource = vi.fn();
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource, onDeleteResource: vi.fn() });
      fireEvent.click(screen.getAllByTitle('Move right')[0]);
      expect(onMoveResource).toHaveBeenCalledWith(twoNotes[0], 'right');
    });

    it('calls onMoveResource with "left" when move left is clicked', () => {
      const onMoveResource = vi.fn();
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource, onDeleteResource: vi.fn() });
      fireEvent.click(screen.getAllByTitle('Move left')[1]);
      expect(onMoveResource).toHaveBeenCalledWith(twoNotes[1], 'left');
    });

    it('shows delete buttons for deletable resources', () => {
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource: vi.fn(), onDeleteResource: vi.fn() });
      expect(screen.getAllByTitle('Delete resource').length).toBe(2);
    });

    it('calls onDeleteResource when delete button is clicked', () => {
      const onDeleteResource = vi.fn();
      renderNav({ resources: twoNotes, canEdit: true, onMoveResource: vi.fn(), onDeleteResource });
      fireEvent.click(screen.getAllByTitle('Delete resource')[0]);
      expect(onDeleteResource).toHaveBeenCalledWith(twoNotes[0]);
    });

    it('does not show move/delete controls for lessonPlan type', () => {
      renderNav({
        resources: [makeResource({ key: 'r1', title: 'Lesson Plan', type: 'lessonPlan' })],
        canEdit: true,
        onMoveResource: vi.fn(),
        onDeleteResource: vi.fn(),
      });
      expect(screen.queryByTitle('Delete resource')).toBeNull();
      expect(screen.queryByTitle('Move left')).toBeNull();
    });

    it('does not show edit controls when canEdit=false', () => {
      renderNav({ resources: twoNotes, canEdit: false, onMoveResource: vi.fn(), onDeleteResource: vi.fn() });
      expect(screen.queryByTitle('Delete resource')).toBeNull();
      expect(screen.queryByTitle('Move left')).toBeNull();
    });
  });

  describe('Add resource menu', () => {
    it('shows Add button when canEdit and onAddResource provided', () => {
      renderNav({ canEdit: true, onAddResource: vi.fn() });
      expect(screen.getByRole('button', { name: /add/i })).toBeTruthy();
    });

    it('does not show Add button when canEdit=false', () => {
      renderNav({ canEdit: false, onAddResource: vi.fn() });
      expect(screen.queryByRole('button', { name: /^\s*Add\s*$/i })).toBeNull();
    });

    it('does not show Add button when onAddResource not provided', () => {
      renderNav({ canEdit: true });
      expect(screen.queryByRole('button', { name: /^\s*Add\s*$/i })).toBeNull();
    });

    it('opens dropdown menu when Add button is clicked', () => {
      renderNav({ canEdit: true, onAddResource: vi.fn() });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      expect(screen.getByRole('button', { name: 'Note' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Lecture' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Video' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Vocabulary' })).toBeTruthy();
    });

    it('calls onAddResource with correct type and closes menu', () => {
      const onAddResource = vi.fn();
      renderNav({ canEdit: true, onAddResource });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Note' }));
      expect(onAddResource).toHaveBeenCalledWith('note');
      expect(screen.queryByRole('button', { name: 'Lecture' })).toBeNull();
    });

    it('calls onAddResource with "lecture" type', () => {
      const onAddResource = vi.fn();
      renderNav({ canEdit: true, onAddResource });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Lecture' }));
      expect(onAddResource).toHaveBeenCalledWith('lecture');
    });

    it('calls onAddResource with "video" type', () => {
      const onAddResource = vi.fn();
      renderNav({ canEdit: true, onAddResource });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Video' }));
      expect(onAddResource).toHaveBeenCalledWith('video');
    });

    it('calls onAddResource with "vocab" type', () => {
      const onAddResource = vi.fn();
      renderNav({ canEdit: true, onAddResource });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Vocabulary' }));
      expect(onAddResource).toHaveBeenCalledWith('vocab');
    });

    it('closes menu when clicking outside', () => {
      renderNav({ canEdit: true, onAddResource: vi.fn() });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      expect(screen.getByRole('button', { name: 'Lecture' })).toBeTruthy();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByRole('button', { name: 'Lecture' })).toBeNull();
    });

    it('toggles menu closed when Add button is clicked again', () => {
      renderNav({ canEdit: true, onAddResource: vi.fn() });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      expect(screen.getByRole('button', { name: 'Lecture' })).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: /add/i }));
      expect(screen.queryByRole('button', { name: 'Lecture' })).toBeNull();
    });
  });
});
