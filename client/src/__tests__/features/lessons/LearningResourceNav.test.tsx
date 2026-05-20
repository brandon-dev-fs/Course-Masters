import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LearningResourceNav from '../../../features/lessons/LearningResourceNav.js';
import type { LearningResource } from '../../../features/lessons/LearningResourceNav.js';

const resources: LearningResource[] = [
  { key: 'lessonPlan', type: 'lessonPlan', title: 'Lesson Plan', id: 'lp1' },
  { key: 'v1', type: 'video', title: 'Intro Video', id: 'v1' },
  { key: 'n1', type: 'note', title: 'Study Notes', id: 'n1' },
];

describe('LearningResourceNav', () => {
  const onResourceChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderNav(props: Partial<Parameters<typeof LearningResourceNav>[0]> = {}) {
    return render(
      <LearningResourceNav
        resources={resources}
        activeResourceKey="lessonPlan"
        onResourceChange={onResourceChange}
        completedKeys={new Set()}
        quizUnlocked={false}
        {...props}
      />
    );
  }

  it('renders all resource titles', () => {
    renderNav();
    expect(screen.getByText('Lesson Plan')).toBeInTheDocument();
    expect(screen.getByText('Intro Video')).toBeInTheDocument();
    expect(screen.getByText('Study Notes')).toBeInTheDocument();
  });

  it('renders Quiz button', () => {
    renderNav();
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  it('calls onResourceChange when resource button is clicked', () => {
    renderNav();
    fireEvent.click(screen.getByText('Intro Video'));
    expect(onResourceChange).toHaveBeenCalledWith('v1');
  });

  it('quiz button is disabled when not unlocked', () => {
    renderNav({ quizUnlocked: false });
    const quizBtn = screen.getByText('Quiz').closest('button');
    expect(quizBtn).toBeDisabled();
  });

  it('quiz button is enabled when unlocked', () => {
    renderNav({ quizUnlocked: true });
    const quizBtn = screen.getByText('Quiz').closest('button');
    expect(quizBtn).not.toBeDisabled();
  });

  it('calls onResourceChange for quiz when unlocked', () => {
    renderNav({ quizUnlocked: true });
    fireEvent.click(screen.getByText('Quiz').closest('button')!);
    expect(onResourceChange).toHaveBeenCalledWith('quiz');
  });

  it('does not call onResourceChange for quiz when locked', () => {
    renderNav({ quizUnlocked: false });
    fireEvent.click(screen.getByText('Quiz').closest('button')!);
    expect(onResourceChange).not.toHaveBeenCalled();
  });

  it('renders Add button when canEdit and onAddResource provided', () => {
    renderNav({ canEdit: true, onAddResource: vi.fn() });
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('opens add menu when Add button is clicked', () => {
    renderNav({ canEdit: true, onAddResource: vi.fn() });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Note')).toBeInTheDocument();
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Lecture')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
  });

  it('calls onAddResource with type when menu item is clicked', () => {
    const onAddResource = vi.fn();
    renderNav({ canEdit: true, onAddResource });
    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Note'));
    expect(onAddResource).toHaveBeenCalledWith('note');
  });

  it('closes add menu after selecting an item', () => {
    const onAddResource = vi.fn();
    renderNav({ canEdit: true, onAddResource });
    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByText('Video'));
    expect(screen.queryByText('Note')).not.toBeInTheDocument();
  });

  it('shows delete buttons for reorderable resources when canEdit', () => {
    renderNav({ canEdit: true, onDeleteResource: vi.fn() });
    expect(screen.getAllByTitle('Delete resource')[0]).toBeInTheDocument();
  });
});
