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
vi.mock('../../../features/builder/LessonRow.js', () => ({
  default: ({ lesson }: { lesson: { title: string } }) => (
    <div data-testid="lesson-row">{lesson.title}</div>
  ),
}));
vi.mock('../../../features/builder/AssessmentRow.js', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="assessment-row">{label}</div>
  ),
}));
vi.mock('../../../features/builder/AddItemButton.js', () => ({
  default: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick}>{label}</button>
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
vi.mock('../../../features/builder/hooks/useDragReorder.js', () => ({
  useDragReorder: () => ({
    sensors: [],
    handleDragEnd: vi.fn(),
  }),
}));

import UnitRow from '../../../features/builder/UnitRow.js';
import type { BuilderUnit } from '../../../api/types.js';

const makeUnit = (overrides?: Partial<BuilderUnit>): BuilderUnit => ({
  id: 'unit-1',
  title: 'Test Unit',
  description: 'A test unit',
  order: 1,
  lessons: [],
  assessment: null,
  ...overrides,
});

const defaultProps = {
  courseId: 'course-1',
  isExpanded: false,
  expandedLessons: new Set<string>(),
  renamingId: null,
  isFirst: false,
  isLast: false,
  onToggle: vi.fn(),
  onToggleLesson: vi.fn(),
  onRename: vi.fn().mockResolvedValue(undefined),
  onRenameLesson: vi.fn().mockResolvedValue(undefined),
  onStartRename: vi.fn(),
  onCancelRename: vi.fn(),
  onDelete: vi.fn(),
  onDeleteLesson: vi.fn(),
  onDeleteActivity: vi.fn(),
  onEditActivity: vi.fn(),
  onAddLesson: vi.fn(),
  onAddActivity: vi.fn(),
  onReorderLessons: vi.fn().mockResolvedValue(undefined),
  onReorderActivities: vi.fn().mockResolvedValue(undefined),
  onMoveUnit: vi.fn(),
  onMoveLesson: vi.fn(),
  onMoveActivity: vi.fn(),
  onEditUnit: vi.fn(),
  onEditPlanLesson: vi.fn(),
  announce: vi.fn(),
};

describe('UnitRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the unit title', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} />);
    expect(screen.getByText('Test Unit')).toBeInTheDocument();
  });

  it('has treeitem role with aria-label', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} />);
    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-label', 'Unit: Test Unit');
  });

  it('shows lesson count', () => {
    const unit = makeUnit({
      lessons: [
        { id: 'l1', title: 'Lesson 1', order: 1, hasLessonPlan: false, assignments: [], assessment: null },
        { id: 'l2', title: 'Lesson 2', order: 2, hasLessonPlan: false, assignments: [], assessment: null },
      ],
    });
    render(<UnitRow unit={unit} {...defaultProps} />);
    expect(screen.getByText(/2 lessons/)).toBeInTheDocument();
  });

  it('calls onToggle when expand button is clicked', () => {
    const onToggle = vi.fn();
    render(<UnitRow unit={makeUnit()} {...defaultProps} onToggle={onToggle} />);
    const expandBtn = screen.getByRole('button', { name: /expand unit/i });
    fireEvent.click(expandBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows children when isExpanded is true', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} isExpanded={true} />);
    expect(screen.getByRole('button', { name: 'Add lesson' })).toBeInTheDocument();
  });

  it('does not show children when isExpanded is false', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} isExpanded={false} />);
    expect(screen.queryByRole('button', { name: 'Add lesson' })).not.toBeInTheDocument();
  });

  it('shows "No lessons" message when expanded with no lessons', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} isExpanded={true} />);
    expect(screen.getByText(/no lessons in this unit/i)).toBeInTheDocument();
  });

  it('renders lesson rows when expanded with lessons', () => {
    const unit = makeUnit({
      lessons: [{ id: 'l1', title: 'Lesson 1', order: 1, hasLessonPlan: false, assignments: [], assessment: null }],
    });
    render(<UnitRow unit={unit} {...defaultProps} isExpanded={true} />);
    expect(screen.getByTestId('lesson-row')).toBeInTheDocument();
  });

  it('calls onAddLesson when Add lesson button is clicked', () => {
    const onAddLesson = vi.fn();
    render(
      <UnitRow unit={makeUnit()} {...defaultProps} isExpanded={true} onAddLesson={onAddLesson} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add lesson' }));
    expect(onAddLesson).toHaveBeenCalledTimes(1);
  });

  it('shows unit description when expanded', () => {
    render(<UnitRow unit={makeUnit({ description: 'Unit description text' })} {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Unit description text')).toBeInTheDocument();
  });

  it('shows "No description" italic text when description is empty', () => {
    render(<UnitRow unit={makeUnit({ description: '' })} {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('shows InlineRenameInput when renamingId matches unit id', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} renamingId="unit-1" />);
    expect(screen.getByRole('textbox', { name: /rename unit/i })).toBeInTheDocument();
  });

  it('applies opacity class when isDragging is true', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} isDragging={true} />);
    expect(screen.getByRole('treeitem')).toHaveClass('opacity-50');
  });

  it('opens context menu and calls onDelete', () => {
    const onDelete = vi.fn();
    render(<UnitRow unit={makeUnit()} {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for unit/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete unit' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('opens context menu and calls onStartRename', () => {
    const onStartRename = vi.fn();
    render(<UnitRow unit={makeUnit()} {...defaultProps} onStartRename={onStartRename} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for unit/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(onStartRename).toHaveBeenCalledWith('unit-1');
  });

  it('opens context menu and calls onEditUnit', () => {
    const onEditUnit = vi.fn();
    render(<UnitRow unit={makeUnit()} {...defaultProps} onEditUnit={onEditUnit} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for unit/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit details' }));
    expect(onEditUnit).toHaveBeenCalledTimes(1);
  });

  it('disables Move up in context menu when isFirst', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} isFirst={true} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for unit/i }));
    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
  });

  it('disables Move down in context menu when isLast', () => {
    render(<UnitRow unit={makeUnit()} {...defaultProps} isLast={true} />);
    fireEvent.click(screen.getByRole('button', { name: /actions for unit/i }));
    expect(screen.getByRole('button', { name: 'Move down' })).toBeDisabled();
  });
});
