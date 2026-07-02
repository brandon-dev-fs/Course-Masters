import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock @dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
  closestCenter: {},
}));
vi.mock('@dnd-kit/modifiers', () => ({ restrictToVerticalAxis: vi.fn() }));
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

// Mock child components
vi.mock('../../../features/builder/ActivityRow.js', () => ({
  default: ({ activity }: { activity: { title: string } }) => (
    <div data-testid="activity-row">{activity.title}</div>
  ),
}));
vi.mock('../../../features/builder/AssessmentRow.js', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="assessment-row">{label}</div>
  ),
}));
vi.mock('../../../features/builder/AddItemButton.js', () => ({
  default: ({ label, onClick, ariaLabel }: { label: string; onClick: () => void; ariaLabel?: string }) => (
    <button onClick={onClick} aria-label={ariaLabel ?? label}>
      {label}
    </button>
  ),
}));
vi.mock('../../../features/builder/InlineRenameInput.js', () => ({
  default: ({ onSave, onCancel, ariaLabel }: { initialValue: string; onSave: (v: string) => void; onCancel: () => void; ariaLabel: string }) => (
    <div>
      <input aria-label={ariaLabel} />
      <button onClick={() => onSave('new title')}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));
vi.mock('../../../features/builder/DropdownMenu.js', () => ({
  default: ({
    items,
    onClose,
  }: {
    items: Array<{ label: string; onClick: () => void; disabled?: boolean }>;
    onClose: () => void;
    ariaLabel: string;
  }) => (
    <div role="menu">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            if (!item.disabled) item.onClick();
            onClose();
          }}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock('../../../features/builder/LessonPlanRow.js', () => ({
  default: ({ hasLessonPlan, onClick }: { hasLessonPlan: boolean; onClick: () => void }) => (
    <button data-testid="lesson-plan-row" onClick={onClick}>
      {hasLessonPlan ? 'plan-set' : 'plan-not-set'}
    </button>
  ),
}));
vi.mock('../../../features/builder/hooks/useDragReorder.js', () => ({
  useDragReorder: () => ({
    sensors: [],
    handleDragEnd: vi.fn(),
  }),
}));

import LessonRow from '../../../features/builder/LessonRow.js';
import type { BuilderLesson } from '../../../api/types.js';

const makeLesson = (overrides?: Partial<BuilderLesson>): BuilderLesson => ({
  id: 'lesson-1',
  title: 'Test Lesson',
  order: 1,
  hasLessonPlan: false,
  assignments: [],
  assessment: null,
  ...overrides,
});

const defaultProps = {
  unitId: 'unit-1',
  isExpanded: false,
  renamingId: null,
  isFirst: false,
  isLast: false,
  onToggle: vi.fn(),
  onRename: vi.fn().mockResolvedValue(undefined),
  onStartRename: vi.fn(),
  onCancelRename: vi.fn(),
  onDelete: vi.fn(),
  onDeleteActivity: vi.fn(),
  onEditActivity: vi.fn(),
  onAddActivity: vi.fn(),
  onReorderActivities: vi.fn().mockResolvedValue(undefined),
  onMoveLesson: vi.fn(),
  onMoveActivity: vi.fn(),
  onEditPlan: vi.fn(),
  announce: vi.fn(),
};

describe('LessonRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the lesson title', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} />);
    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
  });

  it('has treeitem role with aria-label', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} />);
    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-label', 'Lesson: Test Lesson');
  });

  it('shows activity count', () => {
    const lesson = makeLesson({
      assignments: [
        { id: 'a1', title: 'Activity 1', type: 'note', order: 1 },
        { id: 'a2', title: 'Activity 2', type: 'vocab', order: 2 },
      ],
    });
    render(<LessonRow lesson={lesson} {...defaultProps} />);
    expect(screen.getByText(/2 activities/)).toBeInTheDocument();
  });

  it('calls onToggle when expand button is clicked', () => {
    const onToggle = vi.fn();
    render(<LessonRow lesson={makeLesson()} {...defaultProps} onToggle={onToggle} />);
    const expandBtn = screen.getByRole('button', { name: /expand lesson/i });
    fireEvent.click(expandBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows children when isExpanded is true', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} isExpanded={true} />);
    expect(screen.getByRole('button', { name: /add activity/i })).toBeInTheDocument();
  });

  it('does not show children when isExpanded is false', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} isExpanded={false} />);
    expect(screen.queryByRole('button', { name: /add activity/i })).not.toBeInTheDocument();
  });

  it('shows "No activities" message when expanded with no assignments', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} isExpanded={true} />);
    expect(screen.getByText(/no activities in this lesson/i)).toBeInTheDocument();
  });

  it('renders activity rows when expanded with assignments', () => {
    const lesson = makeLesson({
      assignments: [{ id: 'a1', title: 'Activity 1', type: 'note', order: 1 }],
    });
    render(<LessonRow lesson={lesson} {...defaultProps} isExpanded={true} />);
    expect(screen.getByTestId('activity-row')).toBeInTheDocument();
  });

  it('calls onAddActivity when Add activity button is clicked', () => {
    const onAddActivity = vi.fn();
    render(
      <LessonRow lesson={makeLesson()} {...defaultProps} isExpanded={true} onAddActivity={onAddActivity} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /add activity/i }));
    expect(onAddActivity).toHaveBeenCalledTimes(1);
  });

  it('shows InlineRenameInput when renamingId matches lesson id', () => {
    render(
      <LessonRow lesson={makeLesson()} {...defaultProps} renamingId="lesson-1" />,
    );
    expect(screen.getByRole('textbox', { name: /rename lesson/i })).toBeInTheDocument();
  });

  it('applies opacity class when isDragging is true', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} isDragging={true} />);
    expect(screen.getByRole('treeitem')).toHaveClass('opacity-50');
  });

  it('opens context menu and calls onDelete', () => {
    const onDelete = vi.fn();
    render(<LessonRow lesson={makeLesson()} {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for lesson/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete lesson' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('opens context menu and calls onStartRename', () => {
    const onStartRename = vi.fn();
    render(<LessonRow lesson={makeLesson()} {...defaultProps} onStartRename={onStartRename} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for lesson/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(onStartRename).toHaveBeenCalledWith('lesson-1');
  });

  it('disables Move up in context menu when isFirst', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} isFirst={true} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for lesson/i }));
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
  });

  it('disables Move down in context menu when isLast', () => {
    render(<LessonRow lesson={makeLesson()} {...defaultProps} isLast={true} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for lesson/i }));
    expect(screen.getByRole('button', { name: 'Move down' })).toBeDisabled();
  });
});
