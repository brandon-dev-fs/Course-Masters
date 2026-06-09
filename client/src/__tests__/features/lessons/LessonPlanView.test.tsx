vi.mock('../../../components/RichTextEditor.js', () => ({
  default: ({ content }: { content: unknown }) => (
    <div data-testid="rich-text-editor">{JSON.stringify(content)}</div>
  ),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonPlanView from '../../../features/lessons/LessonPlanView.js';
import type { Lesson } from '../../../api/types.js';

const baseLesson: Lesson = {
  id: 'l1',
  unitId: 'u1',
  title: 'Intro Lesson',
  description: 'A lesson',
  order: 1,
  objective: '',
  planContent: {},
};

describe('LessonPlanView', () => {
  const onEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state with no content and cannot edit', () => {
    render(<LessonPlanView lesson={baseLesson} canEdit={false} onEdit={onEdit} />);
    expect(screen.getByText('No lesson plan')).toBeInTheDocument();
  });

  it('shows empty state with action button when canEdit and no content', () => {
    render(<LessonPlanView lesson={baseLesson} canEdit={true} onEdit={onEdit} />);
    expect(screen.getByText('Edit Lesson Plan')).toBeInTheDocument();
  });

  it('calls onEdit when empty state action is clicked', () => {
    render(<LessonPlanView lesson={baseLesson} canEdit={true} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Edit Lesson Plan'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('renders learning objective when present', () => {
    const lesson = { ...baseLesson, objective: 'Learn to code' };
    render(<LessonPlanView lesson={lesson} canEdit={false} onEdit={onEdit} />);
    expect(screen.getByText('Learn to code')).toBeInTheDocument();
    expect(screen.getByText('Learning Objective')).toBeInTheDocument();
  });

  it('renders rich text editor for plan content when present', () => {
    const lesson = { ...baseLesson, planContent: { type: 'doc', content: [] } };
    render(<LessonPlanView lesson={lesson} canEdit={false} onEdit={onEdit} />);
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    expect(screen.getByText('Lesson Plan')).toBeInTheDocument();
  });

  it('shows Edit button when canEdit and content exists', () => {
    const lesson = { ...baseLesson, objective: 'Learn to code' };
    render(<LessonPlanView lesson={lesson} canEdit={true} onEdit={onEdit} />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', () => {
    const lesson = { ...baseLesson, objective: 'Learn to code' };
    render(<LessonPlanView lesson={lesson} canEdit={true} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('shows completion button when onToggleComplete is provided', () => {
    const lesson = { ...baseLesson, objective: 'Learn to code' };
    render(
      <LessonPlanView
        lesson={lesson}
        canEdit={false}
        onEdit={onEdit}
        isComplete={false}
        onToggleComplete={vi.fn()}
      />
    );
    expect(screen.getByText('Mark as complete')).toBeInTheDocument();
  });

  it('shows Completed text when isComplete is true', () => {
    const lesson = { ...baseLesson, objective: 'Learn to code' };
    render(
      <LessonPlanView
        lesson={lesson}
        canEdit={false}
        onEdit={onEdit}
        isComplete={true}
        onToggleComplete={vi.fn()}
      />
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
